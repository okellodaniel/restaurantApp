module.exports = (options) => {
  const seneca = this;
  const plugin = 'cart';

  seneca.add({ role: plugin, cmd: 'get' }, get);
  seneca.add({ role: plugin, cmd: 'add' }, add);
  seneca.add({ role: plugin, cmd: 'remove' }, remove);
  seneca.add({ role: plugin, cmd: 'clear' }, clear);

  function get(args, done) {
    return done(null, getCart(args.userId));
  }

  function add(args, done) {
    const cart = getCart(args.userId);

    if (!cart) {
      cart = createCart(args.userIf);
    }

    cart.items.push({
      itemId: args.itemId,
      restaurantId: args.restaurantId,
      restaurantName: args.restaurantName,
      itemName: args.itemName,
      itemPrice: args.itemPrice,
    });

    cart.total += +args.itemPrice;
    cart.total.toFixed(2);
    return done(null, cart);
  }

  function remove(args, done) {
    const cart = getCart(args.userId);
    const item = cart.items.filter((obj, idx) => (obj.itemid == args.itemId && obj.restaurantId == args.restaurantId))[0];
    const idx = cart.items.indexOf(item);

    if (item) cart.items.splice(idx, 1);
    cart.total -= item.itemPrice;

    return done(null, cart);
  }

  function clear(args, done) {
    let cart = getCart(args.userId);

    if (!cart) {
      cart = createCart(args.userId);
    }

    cart.items = [];
    cart.total = 0.00;

    done(null, cart);
  }

  function getCart(userId) {
    const cart = carts.filter((obj, idx) => obj.userId === userId)[0];

    if (!cart) cart = createCart(userId);

    return cart;
  }

  function createCart(userId) {
    const cart = {
      userId,
      total: 0.0,
      items: [],
    };

    carts.push(cart);

    return cart;
  }
  return { name: plugin };
};

var carts = [];
