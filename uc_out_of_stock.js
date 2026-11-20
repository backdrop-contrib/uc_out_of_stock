(function ($) {
  Backdrop.behaviors.ucOutOfStock = {
    attach: function (context) {

      if (typeof console === 'undefined') {
        console = {log: function () {}};
      }

      var buttonSelector = 'input:submit.node-add-to-cart,input:submit.list-add-to-cart,button.node-add-to-cart,button.list-add-to-cart';

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
        $.ajax({
          type: 'post',
          url: Backdrop.settings.uc_out_of_stock.path,
          data: post,
          success: function (data, textStatus) {
            $.each(data, function (form_id, stock_level) {
              var form = $('#' + form_id);
              var qtyField = $(':input[name=qty]', form);
              var qtyId = qtyField.attr('id');
              if (stock_level !== null && parseInt(stock_level, 10) <= 0) {
                $(buttonSelector, form).hide();
                $('label[for=' + qtyId + ']', form).hide();
                qtyField.hide();
                $('#' + qtyId + '-wrapper', form).hide();
                $('.uc_out_of_stock_html', form).html(Backdrop.settings.uc_out_of_stock.msg);
                if (Backdrop.settings.uc_out_of_stock.instock) {
                  $('.uc-out-of-stock-instock', form).hide();
                }
              }
              else {
                $('.uc_out_of_stock_html', form).html('');
                $('label[for=' + qtyId + ']', form).show();
                qtyField.show();
                $('#' + qtyId + '-wrapper', form).show();
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

      var forms = [];
      $('form[id*=uc-product-add-to-cart-form], form[id*=uc-catalog-buy-it-now-form]').not('.uc-out-stock-processed').each(function () {
        var form = $(this);
        form.addClass('uc-out-stock-processed');
        forms.push(form);

        if (Backdrop.settings.uc_out_of_stock.throbber) {
          $(buttonSelector, form).before('<div class="uc_out_of_stock_throbbing">&nbsp;&nbsp;&nbsp;&nbsp;</div>');
        }

        if (Backdrop.settings.uc_out_of_stock.instock) {
          if ($(':input[name="qty"][type!="hidden"]', form).length) {
            $(':input[name=qty]', form).after('<div class="uc-out-of-stock-instock"></div>');
          }
          else {
            $(buttonSelector, form).before('<div class="uc-out-of-stock-instock"></div>');
          }
        }

        $(buttonSelector, form).after('<div class="uc_out_of_stock_html"></div>');

        $('[name*=attributes]', form).filter(':input:not(:text):not(:checkbox)').change(function () {
          checkStock([form]);
        });
      });

      checkStock(forms);
    }
  };

  Backdrop.theme.prototype.ucOutOfStockInStock = function (stock) {
    // Unknown stock (no stock record, or attributes not fully selected yet).
    if (stock === undefined || stock === null) {
      return Backdrop.t('In stock');
    }
    // Optional threshold: show the exact number only when the remaining
    // stock is at or below the configured value (0 = always show the number).
    var threshold = parseInt(Backdrop.settings.uc_out_of_stock.instock_threshold, 10) || 0;
    if (threshold > 0 && parseInt(stock, 10) > threshold) {
      return Backdrop.t('In stock');
    }
    return Backdrop.t('@stock in stock', {'@stock': stock});
  };
})(jQuery);
