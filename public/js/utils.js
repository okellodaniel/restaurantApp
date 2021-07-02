function updateCart(cart) {
  const count = cart.items.length;
  $('#cart-button').text(count);
}

function removeFromCart(restaurantId, itemId, rowNumber) {
  const data = {
    restaurantId,
    itemId,
  };

  $.ajax({
    type: 'DELETE',
    url: 'cart',
    data,
    success(cart) {
      if (cart.items.length == 0) {
        window.location.href = 'cart';
      }
      updateCart(cart);
      $(`#row-${rowNumber}`).remove();
      $('#total-price').text(`Total Price $ ${cart.total}`);
    },
  });
}

function addToCart(restaurantId, itemId) {
  const data = {
    restaurantId,
    itemId,
  };

  $.ajax({
    type: 'POST',
    url: 'cart',
    data,
    success(cart) {
      updateCart(cart);
    },
  });
}
