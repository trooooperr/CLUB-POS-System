const Inventory = require('../models/Inventory');
const MenuItem = require('../models/MenuItem');
const { deleteCache } = require('./redis');

const INVENTORY_CACHE_KEY = 'inventory:all';
const MENU_CACHE_KEY = 'menu:all';

function itemKey(item) {
  return (item?.name || '').trim();
}

function aggregateQuantities(items = []) {
  const quantities = new Map();

  for (const item of items) {
    const name = itemKey(item);
    const quantity = Math.abs(Number(item?.quantity) || 0);
    if (!name || quantity <= 0) continue;
    quantities.set(name, (quantities.get(name) || 0) + quantity);
  }

  return quantities;
}

function itemsFromQuantityMap(quantities) {
  return [...quantities.entries()].map(([name, quantity]) => ({ name, quantity }));
}

async function updateMenuAvailability(names) {
  if (!names.length) return;

  const inventoryItems = await Inventory.find({ name: { $in: names } }).select('name stock trackStock');
  const ops = inventoryItems.map(item => ({
    updateOne: {
      filter: { name: item.name },
      update: { $set: { available: item.trackStock === false ? true : (item.stock > 0) } }
    }
  }));

  if (ops.length) await MenuItem.bulkWrite(ops, { ordered: false });
}

async function getInventorySnapshot() {
  const items = await Inventory.find();
  const Settings = require('../models/Settings');
  const settings = await Settings.findOne();
  const inventoryCategories = settings ? (settings.inventoryCategories || []) : [];
  
  items.sort((a, b) => {
    const catAIndex = inventoryCategories.indexOf(a.category);
    const catBIndex = inventoryCategories.indexOf(b.category);
    
    const indexA = catAIndex === -1 ? 999999 : catAIndex;
    const indexB = catBIndex === -1 ? 999999 : catBIndex;
    
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    
    const orderA = a.order || 0;
    const orderB = b.order || 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    return a.name.localeCompare(b.name);
  });
  return items;
}

async function deductInventoryForItems(items = []) {
  const quantities = aggregateQuantities(items);
  const names = [...quantities.keys()];
  if (!names.length) return getInventorySnapshot();

  const inventoryItems = await Inventory.find({ name: { $in: names } }).select('name trackStock');
  const trackedNames = new Set(
    inventoryItems
      .filter(item => item.trackStock !== false)
      .map(item => item.name)
  );

  const ops = [];
  for (const [name, quantity] of quantities.entries()) {
    if (trackedNames.has(name)) {
      ops.push({
        updateOne: {
          filter: { name },
          update: [
            { $set: { stock: { $max: [0, { $subtract: ['$stock', quantity] }] } } }
          ]
        }
      });
    }
  }

  if (ops.length) {
    await Inventory.bulkWrite(ops, { ordered: false });
  }
  await updateMenuAvailability(names);
  await deleteCache([INVENTORY_CACHE_KEY, MENU_CACHE_KEY]);
  return getInventorySnapshot();
}

function buildInventoryDelta(finalItems = [], alreadyDeducted = new Map()) {
  const finalQuantities = aggregateQuantities(finalItems);
  const delta = new Map();

  for (const [name, quantity] of finalQuantities.entries()) {
    const remaining = quantity - (alreadyDeducted.get(name) || 0);
    if (remaining > 0) delta.set(name, remaining);
  }

  return itemsFromQuantityMap(delta);
}

function broadcastInventoryUpdate(req, inventory, extra = {}) {
  if (!req.app.locals.io || !inventory) return;
  req.app.locals.io.emit('INVENTORY_UPDATED', {
    inventory,
    ...extra,
    timestamp: new Date()
  });
}

module.exports = {
  aggregateQuantities,
  buildInventoryDelta,
  broadcastInventoryUpdate,
  deductInventoryForItems,
  getInventorySnapshot,
};
