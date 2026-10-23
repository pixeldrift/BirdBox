// The record types served by api/records: one table each, one list of fields each. The same
// field lists drive validation here and the edit forms in the app (js/data/record-schemas.js).
// To add a field: add a line here and in js/data/record-schemas.js, and a column in the database.
//
// field: { col (db column), type, required, max, options, ref, readOnly, defaultValue }
//   type: text | number | date | enum | textarray
//   ref:  'contact' | 'bird'  — the value is the id of another record
//   readOnly: sent to the app but never accepted from it (managed elsewhere)

const SCHEMAS = {
  contacts: {
    table: 'contacts', pk: 'id', idPrefix: 'c-', order: 'name',
    fields: {
      name: { col: 'name', type: 'text', required: true, max: 120 },
      company: { col: 'company', type: 'text', max: 120 },
      type: { col: 'type', type: 'enum', required: true, options: ['Breeder', 'Pet Owner', 'Vendor', 'Store', 'Team'] },
      city: { col: 'city', type: 'text', max: 80 },
      state: { col: 'state', type: 'text', max: 40 },
      email: { col: 'email', type: 'text', max: 160 },
      phone: { col: 'phone', type: 'text', max: 40 },
      notes: { col: 'notes', type: 'text', max: 4000 },
      // Who owns which birds is changed through the ownership prompts, not by editing a contact.
      userId: { col: 'user_id', type: 'text', readOnly: true }, // set when this contact mirrors a team member
      birdsOwned: { col: 'birds_owned', type: 'textarray', readOnly: true },
      birdsPurchasing: { col: 'birds_purchasing', type: 'textarray', readOnly: true },
    },
  },
  // The people who help run the aviary. Each one is mirrored as an address-book contact (type 'Team').
  users: {
    table: 'users', pk: 'id', idPrefix: 'u-', order: 'first_name, last_name',
    fields: {
      firstName: { col: 'first_name', type: 'text', required: true, max: 80 },
      lastName: { col: 'last_name', type: 'text', max: 80 },
      role: { col: 'role', type: 'enum', required: true, options: ['Owner', 'Manager', 'Employee', 'Volunteer'] },
      status: { col: 'status', type: 'enum', required: true, options: ['Active', 'Inactive'] },
      email: { col: 'email', type: 'text', max: 160 },
      phone: { col: 'phone', type: 'text', max: 40 },
      notes: { col: 'notes', type: 'text', max: 4000 },
    },
  },
  // Things kept on hand: feed, supplements, cleaning, medical, equipment (see sql/022_supplies.sql).
  supplies: {
    table: 'supplies', pk: 'id', idPrefix: 'sup-', order: 'name',
    fields: {
      name: { col: 'name', type: 'text', required: true, max: 160 },
      category: { col: 'category', type: 'enum', required: true, options: ['Feed', 'Supplement', 'Cleaning', 'Medical', 'Equipment', 'Other'] },
      brand: { col: 'brand', type: 'text', max: 120 },
      description: { col: 'description', type: 'text', max: 1000 },
      unit: { col: 'unit', type: 'text', max: 40 },
      quantity: { col: 'quantity', type: 'number' },
      reorderLevel: { col: 'reorder_level', type: 'number' },
      price: { col: 'price', type: 'number' },
      vendorId: { col: 'vendor_id', type: 'text', ref: 'contact' },
      source: { col: 'source', type: 'text', max: 300 },
      notes: { col: 'notes', type: 'text', max: 4000 },
    },
  },
  // What a place or bird is fed / given (see sql/023_care_plans.sql). The most specific plan wins.
  care: {
    table: 'care_items', pk: 'id', idPrefix: 'care-', order: 'id',
    fields: {
      targetType: { col: 'target_type', type: 'enum', required: true, options: ['aviary', 'location', 'building', 'room', 'cage', 'bird'] },
      targetId: { col: 'target_id', type: 'text', required: true, max: 80 },
      supplyId: { col: 'supply_id', type: 'text', ref: 'supply' },
      label: { col: 'label', type: 'text', max: 160 },
      amount: { col: 'amount', type: 'text', max: 80 },
      mealTime: { col: 'meal_time', type: 'enum', required: true, options: ['Morning', 'Midday', 'Evening', 'Night', 'Anytime'] },
      notes: { col: 'notes', type: 'text', max: 600 },
    },
  },
  // Jobs to do, one-off or repeating (see sql/024_tasks.sql), and each day they're ticked off.
  tasks: {
    table: 'tasks', pk: 'id', idPrefix: 'task-', order: 'start_date, title',
    fields: {
      title: { col: 'title', type: 'text', required: true, max: 160 },
      kind: { col: 'kind', type: 'enum', required: true, options: ['Feeding', 'Cleaning', 'Health', 'Maintenance', 'General'] },
      notes: { col: 'notes', type: 'text', max: 2000 },
      startDate: { col: 'start_date', type: 'date', required: true },
      timeOfDay: { col: 'time_of_day', type: 'enum', required: true, options: ['Morning', 'Midday', 'Evening', 'Night', 'Anytime'] },
      repeat: { col: 'repeat', type: 'enum', required: true, options: ['None', 'Daily', 'Weekly', 'Monthly', 'Custom'] },
      every: { col: 'every', type: 'number' },
      weekdays: { col: 'weekdays', type: 'text', max: 20 },
      endDate: { col: 'end_date', type: 'date' },
      assignedTo: { col: 'assigned_to', type: 'text', ref: 'user' },
      targetType: { col: 'target_type', type: 'text', max: 20 },
      targetId: { col: 'target_id', type: 'text', max: 80 },
    },
  },
  taskdone: {
    table: 'task_done', pk: 'id', idPrefix: 'done-', order: 'on_date',
    fields: {
      taskId: { col: 'task_id', type: 'text', required: true, max: 80 },
      onDate: { col: 'on_date', type: 'date', required: true },
      subKey: { col: 'sub_key', type: 'text', max: 80 },
      doneBy: { col: 'done_by', type: 'text', ref: 'user' },
      notes: { col: 'notes', type: 'text', max: 600 },
    },
  },
  transactions: {
    table: 'transactions', pk: 'id', idPrefix: 'tx-', order: 'date desc',
    fields: {
      item: { col: 'item', type: 'text', required: true, max: 200 },
      amount: { col: 'amount', type: 'number', required: true },
      date: { col: 'date', type: 'date', required: true },
      category: { col: 'category', type: 'enum', required: true, options: ['Sale', 'Purchase', 'Expense', 'Deposit'] },
      funding: { col: 'funding', type: 'text', max: 80 },
      clientId: { col: 'client_id', type: 'text', ref: 'contact' },
      birdId: { col: 'bird_id', type: 'text', ref: 'bird' },
      notes: { col: 'notes', type: 'text', max: 4000 },
    },
  },
  health: {
    table: 'health_records', pk: 'id', idPrefix: 'hr-', order: 'date desc',
    fields: {
      birdId: { col: 'bird_id', type: 'text', required: true, ref: 'bird' },
      type: { col: 'type', type: 'enum', required: true, options: ['DNA Certificate', 'Immunization', 'Surgical Sexing', 'Vet Visit', 'Other'] },
      date: { col: 'date', type: 'date', required: true },
      provider: { col: 'provider', type: 'text', max: 160 },
      notes: { col: 'notes', type: 'text', max: 4000 },
    },
  },
  // The app's menus: home tiles and the tabs inside them (see sql/017_navigation.sql).
  navigation: {
    table: 'navigation', pk: 'id', idPrefix: 'nav-', order: 'sort, id',
    fields: {
      parentId: { col: 'parent_id', type: 'text', max: 80 },
      label: { col: 'label', type: 'text', required: true, max: 60 },
      icon: { col: 'icon', type: 'text', max: 200 },
      blurb: { col: 'blurb', type: 'text', max: 300 },
      sort: { col: 'sort', type: 'number' },
      visible: { col: 'visible', type: 'boolean' },
      homeTile: { col: 'home_tile', type: 'boolean' },
    },
  },
  locations: {
    table: 'locations', pk: 'id', idPrefix: 'loc-', order: 'name',
    fields: {
      name: { col: 'name', type: 'text', required: true, max: 120 },
      description: { col: 'description', type: 'text', max: 400 },
    },
  },
  aviary: {
    table: 'aviary', pk: 'id', idPrefix: 'av-', order: 'id', noCreate: true, noDelete: true,
    fields: {
      name: { col: 'name', type: 'text', required: true, max: 120 },
      description: { col: 'description', type: 'text', max: 600 },
      address: { col: 'address', type: 'text', max: 300 },
      phone: { col: 'phone', type: 'text', max: 60 },
      email: { col: 'email', type: 'text', max: 160 },
      website: { col: 'website', type: 'text', max: 200 },
      socials: { col: 'socials', type: 'text', max: 400 },
    },
  },
  rooms: {
    table: 'rooms', pk: 'id', idPrefix: 'room-', order: 'name',
    fields: {
      name: { col: 'name', type: 'text', required: true, max: 120 },
      description: { col: 'description', type: 'text', max: 400 },
      buildingCode: { col: 'building_code', type: 'text', ref: 'building' },
      locationId: { col: 'location_id', type: 'text', ref: 'location' },
    },
  },
  buildings: {
    table: 'buildings', pk: 'code', idPrefix: '', order: 'code',
    fields: {
      nickname: { col: 'nickname', type: 'text', required: true, max: 80 },
      description: { col: 'description', type: 'text', max: 400 },
      locationId: { col: 'location_id', type: 'text', ref: 'location' },
    },
  },
  cages: {
    table: 'cages', pk: 'code', idPrefix: '', order: 'code',
    fields: {
      buildingCode: { col: 'building_code', type: 'text', ref: 'building' },
      roomId: { col: 'room_id', type: 'text', ref: 'room' },
      description: { col: 'description', type: 'text', max: 400 },
    },
  },
};

module.exports = { SCHEMAS };
