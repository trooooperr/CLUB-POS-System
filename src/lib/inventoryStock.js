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

async function updateMenuAvailability() {
  const inventoryItems = await Inventory.find();
  const inventoryById = new Map(inventoryItems.map(i => [i._id.toString(), i]));

  const ops = [];
  for (const item of inventoryItems) {
    let isAvailable = true;
    if (item.linkInventoryId) {
      const parent = inventoryById.get(item.linkInventoryId.toString());
      if (parent && parent.trackStock !== false) {
        isAvailable = parent.stock >= (item.stockDeductionQty || 1);
      }
    } else {
      if (item.trackStock !== false) {
        isAvailable = item.stock > 0;
      }
    }
    ops.push({
      updateOne: {
        filter: { name: item.name },
        update: { $set: { available: isAvailable } }
      }
    });
  }
  if (ops.length) {
    await MenuItem.bulkWrite(ops, { ordered: false });
  }
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

  const directInvItems = await Inventory.find({ name: { $in: names } });
  
  const parentIds = directInvItems
    .filter(i => i.linkInventoryId)
    .map(i => i.linkInventoryId);

  const allMatching = await Inventory.find({
    $or: [
      { name: { $in: names } },
      { _id: { $in: parentIds } }
    ]
  });

  const inventoryById = new Map(allMatching.map(i => [i._id.toString(), i]));
  const inventoryByName = new Map(allMatching.map(i => [i.name.trim().toLowerCase(), i]));

  const ops = [];
  for (const [name, quantity] of quantities.entries()) {
    const directInv = inventoryByName.get(name.trim().toLowerCase());
    if (!directInv) continue;

    if (directInv.linkInventoryId) {
      const parentInv = inventoryById.get(directInv.linkInventoryId.toString());
      if (parentInv && parentInv.trackStock !== false) {
        const deductQty = quantity * (directInv.stockDeductionQty || 1);
        ops.push({
          updateOne: {
            filter: { _id: parentInv._id },
            update: [
              { $set: { stock: { $max: [0, { $subtract: ['$stock', deductQty] }] } } }
            ]
          }
        });
      }
    } else {
      if (directInv.trackStock !== false) {
        ops.push({
          updateOne: {
            filter: { _id: directInv._id },
            update: [
              { $set: { stock: { $max: [0, { $subtract: ['$stock', quantity] }] } } }
            ]
          }
        });
      }
    }
  }

  if (ops.length) {
    await Inventory.bulkWrite(ops, { ordered: false });
  }
  await updateMenuAvailability();
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

async function refundInventoryForItems(items = []) {
  const quantities = aggregateQuantities(items);
  const names = [...quantities.keys()];
  if (!names.length) return getInventorySnapshot();

  const directInvItems = await Inventory.find({ name: { $in: names } });
  
  const parentIds = directInvItems
    .filter(i => i.linkInventoryId)
    .map(i => i.linkInventoryId);

  const allMatching = await Inventory.find({
    $or: [
      { name: { $in: names } },
      { _id: { $in: parentIds } }
    ]
  });

  const inventoryById = new Map(allMatching.map(i => [i._id.toString(), i]));
  const inventoryByName = new Map(allMatching.map(i => [i.name.trim().toLowerCase(), i]));

  const ops = [];
  for (const [name, quantity] of quantities.entries()) {
    const directInv = inventoryByName.get(name.trim().toLowerCase());
    if (!directInv) continue;

    if (directInv.linkInventoryId) {
      const parentInv = inventoryById.get(directInv.linkInventoryId.toString());
      if (parentInv && parentInv.trackStock !== false) {
        const refundQty = quantity * (directInv.stockDeductionQty || 1);
        ops.push({
          updateOne: {
            filter: { _id: parentInv._id },
            update: { $inc: { stock: refundQty } }
          }
        });
      }
    } else {
      if (directInv.trackStock !== false) {
        ops.push({
          updateOne: {
            filter: { _id: directInv._id },
            update: { $inc: { stock: quantity } }
          }
        });
      }
    }
  }

  if (ops.length) {
    await Inventory.bulkWrite(ops, { ordered: false });
  }
  await updateMenuAvailability();
  await deleteCache([INVENTORY_CACHE_KEY, MENU_CACHE_KEY]);
  return getInventorySnapshot();
}

module.exports = {
  aggregateQuantities,
  buildInventoryDelta,
  broadcastInventoryUpdate,
  deductInventoryForItems,
  refundInventoryForItems,
  getInventorySnapshot,
  updateMenuAvailability,
};
