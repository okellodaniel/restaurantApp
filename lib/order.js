module.exports = (options) => {
  const seneca = this;
  const plugin = 'order';

  seneca.add({ role: plugin, cmd: 'placeOrder' }, placeOrder);

  function placeOrder(args, done) {
    const orders = packageOrders(args.cart);

    for (let i = 0; i < orders.length; i++) {
      sendOrder(orders[i]);
    }

    done(null, { success: true, orders });
  }

  function packageOrders(cart) {
    orders = [];

    for (let i = 0; i < cart.items.length; i++) {
      var item = cart.items[i];
      const order = orders.filter((obj, idx) => {
        obj.restaurantId == item.restaurantId;
      })[0];

      if (!order) {
        order = {
          restaurantId: item.restaurantId,
          items: [item],
        };
        orders.push(order);
      } else {
        order.items.push(item);
      }
    }
    return orders;
  }

  function sendOrder(order) {
    //   TODO integrate into your resturants
    return true;
  }

  return { name: plugin };
};
