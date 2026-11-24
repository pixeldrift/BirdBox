// Builds sql/batches/menu-tidy-one-block.sql: sql/041_menu_tidy.sql as ONE statement (a DO block) for the Neon SQL editor.   node scripts/gen-menu-block.js
const fs = require('fs'), path = require('path');
const body = fs.readFileSync(path.join(__dirname, '..', 'sql', '041_menu_tidy.sql'), 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'sql', 'batches', 'menu-tidy-one-block.sql'), `-- MENU TIDY — one statement. Paste ALL of this file into the Neon SQL editor and run it once. Safe to run again.\ndo $menus$\nbegin\n${body}\nend\n$menus$;\n`);
console.log('wrote sql/batches/menu-tidy-one-block.sql');
