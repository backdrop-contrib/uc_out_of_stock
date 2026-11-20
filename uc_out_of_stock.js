(function ($) {
  Backdrop.behaviors.ucOutOfStock = {
    attach: function (context) {

      if (typeof console === 'undefined') {
        console = {log: function () {}};
      }

      var buttonSelector = 'input:submit.node-add-to-cart,input:submit.list-add-to-cart,button.node-add-to-cart,button.list-add-to-cart';
      var formSelector = 'form[id*=uc-product-add-to-cart-form], form[id*=uc-catalog-buy-it-now-form]';
      var attrSelector = 'form[id*=uc-product-add-to-cart-form] [name*=attributes], form[id*=uc-catalog-buy-it-now-form] [name*=attributes]';

      function ensureDisplay(form) {
        if (!Backdrop.settings.uc_out_of_stock.instock) {
            return;
        }
        if ($('.uc-out-of-stock-instock', form).length) {
            return;
        }
        var display = $('<div class="uc-out-of-stock-instock"></div>');
        var qtyField = $(':input[name=qty]', form);
        if (qtyField.length) {
          // Place the message above the whole quantity form item, directly below
          // the attributes.
          var item = qtyField.closest('.form-item');
          if (item.length) {
            item.before(display);
          }
          else {
            qtyField.before(display);
          }
          }
        else {
          $(buttonSelector, form).before(display);
        }
      }

      function ensureMessage(form) {
        if (!$('.uc_out_of_stock_html', form).length) {
          $(buttonSelector, form).after('<div class="uc_out_of_stock_html"></div>');
        }
      }

      function checkStock(forms) {
        var form_ids = [];
        var node_ids = [];
        var attr_ids = [];

        $.each(forms, function (index, form) {
          var match = form.attr('id').match(/(?:uc-product-add-to-cart-form-|catalog-buy-it-now-form-)([0-9]+)/);
          if (!match) {
            return;
          }
          var nid = match[1];

          // Only select and radio attributes can have SKU adjustments.
          $('[name*=attributes]', form).filter(':input:not(:text):not(:checkbox)').each(function () {
            var nameMatch = $(this).attr('name').match(/attributes\[([0-9]+)\]/);
            if (!nameMatch) {
              return;
            }
            var aid = nameMatch[1];
            if ($(this).is(':radio')) {
              if ($(this).is(':checked') && $(this).val()) {
                attr_ids.push(nid + ':' + aid + ':' + $(this).val());
              }
            }
            else if ($(this).is('select')) {
              if ($(this).val()) {
                attr_ids.push(nid + ':' + aid + ':' + $(this).val());
              }
            }
          });

          if (Backdrop.settings.uc_out_of_stock.throbber) {
            $('.uc_out_of_stock_throbbing', form).addClass('uc_oos_throbbing');
          }
          form_ids.push(form.attr('id'));
          node_ids.push(nid);
        });

        if (form_ids.length === 0) {
          return;
        }

        var post = {'form_ids[]': form_ids, 'node_ids[]': node_ids, 'attr_ids[]': attr_ids};
        if (Backdrop.settings.uc_out_of_stock.debug) {
          console.log('uc_out_of_stock: request', post);
        }

        $.ajax({
          type: 'post',
          url: Backdrop.settings.uc_out_of_stock.path,
          data: post,
          success: function (data, textStatus) {
            if (Backdrop.settings.uc_out_of_stock.debug) {
              console.log('uc_out_of_stock: response', data);
            }

            $.each(data, function (form_id, stock_level) {
              if (form_id.charAt(0) === '_') {
                return;
              }
              var form = $('#' + form_id);
              if (!form.length) {
                if (Backdrop.settings.uc_out_of_stock.debug) {
                  console.log('uc_out_of_stock: form not found', form_id);
                }
                return;
              }
              ensureDisplay(form);
              ensureMessage(form);

              var qtyField = $(':input[name=qty]', form);
              var qtyId = qtyField.attr('id');
              if (stock_level !== null && parseInt(stock_level, 10) <= 0) {
                $(buttonSelector, form).hide();
                if (qtyId) {
                  $('label[for=' + qtyId + ']', form).hide();
                  $('#' + qtyId + '-wrapper', form).hide();
                }
                qtyField.hide();
                $('.uc_out_of_stock_html', form).html(Backdrop.settings.uc_out_of_stock.msg);
                if (Backdrop.settings.uc_out_of_stock.instock) {
                  $('.uc-out-of-stock-instock', form).hide();
                }
              }
              else {
                $('.uc_out_of_stock_html', form).html('');
                if (qtyId) {
                  $('label[for=' + qtyId + ']', form).show();
                  $('#' + qtyId + '-wrapper', form).show();
                }
                qtyField.show();
                $(buttonSelector, form).show();
                if (Backdrop.settings.uc_out_of_stock.instock) {
                  $('.uc-out-of-stock-instock', form).html(Backdrop.theme('ucOutOfStockInStock', stock_level));
                  $('.uc-out-of-stock-instock', form).show();
                }
              }

              if (Backdrop.settings.uc_out_of_stock.throbber) {
                $('.uc_out_of_stock_throbbing', form).removeClass('uc_oos_throbbing');
              }
            });
          },
          error: function (jqXHR, textStatus, errorThrown) {
            console.log('uc_out_of_stock: ' + textStatus + ': ' + jqXHR.responseText);
            if (Backdrop.settings.uc_out_of_stock.throbber) {
              $('.uc_out_of_stock_throbbing').removeClass('uc_oos_throbbing');
            }
          },
          dataType: 'json'
        });
      }

      // Delegated binding: survives the AJAX replacement of the attribute
      // fields by Ubercart.
      $(document).off('change.ucOutOfStock', attrSelector);
      $(document).on('change.ucOutOfStock', attrSelector, function () {
        var form = $(this).closest('form');
        if (!form.length) {
          return;
        }
        ensureDisplay(form);
        ensureMessage(form);
        checkStock([form]);
      });

      // Ubercart replaces the attribute wrapper after its own AJAX call.
      // Re-check the stock once that request has finished.
      $(document).off('ajaxComplete.ucOutOfStock');
      $(document).on('ajaxComplete.ucOutOfStock', function (event, xhr, settings) {
        if (settings.url && settings.url.indexOf('uc_out_of_stock/query') !== -1) {
          return;
        }
        var forms = [];
        $(formSelector).each(function () {
          var form = $(this);
          if (form.find('[name*=attributes]').length) {
            ensureDisplay(form);
            ensureMessage(form);
            forms.push(form);
          }
        });
        if (forms.length) {
          checkStock(forms);
        }
      });

      var forms = [];
      $(formSelector).each(function () {
        var form = $(this);
        if (form.data('ucOutOfStockProcessed')) {
          return;
        }
        form.data('ucOutOfStockProcessed', true);
        forms.push(form);

        if (Backdrop.settings.uc_out_of_stock.throbber) {
          $(buttonSelector, form).before('<div class="uc_out_of_stock_throbbing">&nbsp;&nbsp;&nbsp;&nbsp;</div>');
        }

        ensureDisplay(form);
        ensureMessage(form);
      });

      if (forms.length) {
        checkStock(forms);
      }
    }
  };

  Backdrop.theme.prototype.ucOutOfStockInStock = function (stock) {
    // Unknown stock (no stock record, or attributes not fully selected yet).
    if (stock === undefined || stock === null || stock === '') {
      return Backdrop.t('In stock');
    }
    // Optional threshold: show the exact number only when the remaining
    // stock is at or below the configured value (0 = always show the number).
    var threshold = parseInt(Backdrop.settings.uc_out_of_stock.instock_threshold, 10);
    if (isNaN(threshold)) {
      threshold = 0;
    }
    if (threshold > 0 && parseInt(stock, 10) > threshold) {
      return Backdrop.t('In stock');
    }
    return Backdrop.t('@stock in stock', {'@stock': stock});
  };
})(jQuery);
