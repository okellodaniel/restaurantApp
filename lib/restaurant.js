module.exports = (options) => {
  const seneca = this;
  const plugin = 'restaurant';

  seneca.add({ role: plugin, cmd: 'get' }, get);
  seneca.add({ role: plugin, cmd: 'menu' }, menu);
  seneca.add({ role: plugin, cmd: 'item' }, item);

  function get(args, done) {
    if (args.id) {
      return done(null, getRestaurant(args.id));
    }
    return done(null, restaurants);
  }

  function item(args, done) {
    const { restaurantId } = args;
    const { itemId } = args;
    const restaurant = getRestaurant(restaurantId);
    const desc = restaurant.menu.filter((obj, idx) => obj.itemId == itemId)[0];
    const value = {
      item: desc,
      restaurant,
    };
    return done(null, value);
  }

  function menu(args, done) {
    const { menu } = getRestaurant(args.id);
    return done(null, menu);
  }

  function getRestaurant(id) {
    return restaurants.filter((r, idx) => r.id === id)[0];
  }

  return { name: plugin };
};
