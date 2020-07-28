# Ubercart "Out of Stock" Notification

This module uses Ajax and jQuery to check for available stock and if there is 
no stock available, it replaces the 'Add to cart' button with a configurable
message.

Display attributes types supported for AJAX validation:

 - Select box
 - Radio buttons

It provides server-side validation so this module can prevent the addition of
out of stock items even if Javascript is disabled or if the user clicks on an
"Add to cart" button too quickly.

Validations of stock are performed on the following places, throwing error
messages accordingly:

 - Single product add to cart forms (teaser, full and catalog view): If an
   item out of stock or, if the item you want to add is already on your cart
   but you have reached the stock limit.
 - Shopping cart form: If you try to add more items that the ones in stock of
   any product of your shopping cart.
 - Order checkout and order review form: If the stock information has changed
   while the user is browsing the site (i.e. same item has just been bought
   by another user).

Display attributes type NOT supported - they don't add variations to SKU, so
are not related to stock control:

 - Text field
 - Checkboxes

## Installation

- Install this module using the official Backdrop CMS instructions at
  https://backdropcms.org/guide/modules

## Issues

Bugs and Feature requests should be reported in the 
[Issue Queue](https://github.com/backdrop-contrib/uc_out_of_stock/issues)

## Current Maintainers

- [Laryn Kragt Bakker](https://github.com/laryn) - [CEDC.org](https://cedc.org)

## Credits

- Ported to Backdrop CMS by [Laryn Kragt Bakker](https://github.com/laryn) - [CEDC.org](https://cedc.org).
- Maintained for Drupal by [Ariel Barreiro](https://www.drupal.org/u/hanoii).
- Sponsored for Drupal by Infomagnet, himagarwal, and Neo13.

## License

This project is GPL v2 software. See the [LICENSE.txt](https://github.com/backdrop-contrib/uc_out_of_stock/blob/1.x-1.x/LICENSE.txt)
file in this directory for complete text.
