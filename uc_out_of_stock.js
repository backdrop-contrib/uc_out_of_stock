$(document).ready(function(){
  // Your code here
  //$("form[@id*=uc-product-add-to-cart-form]").css("border","2px solid");
  formid = 'uc-product-add-to-cart-form';
  attrid = 'edit-attributes';
  form = $("form[@id*=uc-product-add-to-cart-form]");

  function checkStock() {
    product = new Object();
    product.nid = form.attr('id').substring(formid.length+1);

    $(":input[@id*=edit-attributes]", form).each(function(index){
      id = $(this).attr('id').substring(attrid.length+1);
      product['attr'+id] = $(this).val();
    });

    $("#uc_out_of_stock_throbbing", form).addClass('uc_oos_throbbing');
    $.post(Drupal.settings.base_path+'uc_out_of_stock/query', product, function (data, textStatus) {
      data = data.split('|');
      stock = data[0];
      html = data[1];
      $("#uc_out_of_stock_html", form).html('');
      $("input:submit", form).show();

      if ( stock == parseInt(stock) ) {
        if ( stock == 0 ) {
          $("input:submit", form).hide();
          //form.append('<a href="' + Drupal.settings.base_path + '/contact">Please enquire')
          $("#uc_out_of_stock_html", form).html(html);
        }
      }
      $("#uc_out_of_stock_throbbing", form).removeClass('uc_oos_throbbing');

      // textStatus can be one of:
      //   "timeout"
      //   "error"
      //   "notmodified"
      //   "success"
      //   "parsererror"
    });
  }

  checkStock();

  $("input:submit", form).before('<div id="uc_out_of_stock_throbbing">&nbsp;&nbsp;&nbsp;&nbsp;</div> ');
  $("input:submit", form).after('<div id="uc_out_of_stock_html"></div');

  $(":input[@id*=edit-attributes]", form).change(function(){
    checkStock();
  });
});