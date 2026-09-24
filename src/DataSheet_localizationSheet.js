import DataSheetBase from './DataSheetBase.js';

export default class DataSheet_localizationSheet extends DataSheetBase {

  constructor(id, updateCb) {
    super(id, updateCb);
    this.requestedKeyPath = "";  // this value can be specified in the React Studio data sheet UI
  }

  makeDefaultItems() {
    // eslint-disable-next-line no-unused-vars
    let key = 1;
    // eslint-disable-next-line no-unused-vars
    let item;
    
    item = {};
    this.items.push(item);
    item['key'] = "start_textblock_383557";
    item['en'] = "Sign In";
    item['sp'] = "Registrarse";
    
    item = {};
    this.items.push(item);
    item['key'] = "start_button_650337";
    item['en'] = "Sign In";
    item['sp'] = "Registrarse";
    
    item = {};
    this.items.push(item);
    item['key'] = "start_buttoncopy_235031";
    item['en'] = "Next >/ Sign Up";
    item['sp'] = "Alistarse";
    
    item = {};
    this.items.push(item);
    item['key'] = "start2_buttoncopy_983650";
    item['en'] = "Sign In";
    item['sp'] = "Registrarse";
    
    item = {};
    this.items.push(item);
    item['key'] = "start2_button_531775";
    item['en'] = "Next >";
    item['sp'] = "Siguente";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccount_field_758291";
    item['en'] = "example@domain.com";
    item['sp'] = "ejemplo@domain.com";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccount_textblock_345476";
    item['en'] = "That’s a new one to us! Let’s get you started with a new account using that email!";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountemail2_textblock_1012589";
    item['en'] = "Choose a password for your account. We aren’t sticklers, but please avoid options like “password123”. Trust us.";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountemail2_button_871163";
    item['en'] = "Next >";
    item['sp'] = "Siguente";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountemail2_field_936901";
    item['en'] = "pick a password";
    item['sp'] = "Elije una contraseña\n";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountemail2_buttoncopy_612574";
    item['en'] = "Sign In";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountpassword_field_61852";
    item['en'] = "pick a password";
    item['sp'] = "Elije una contraseña\n";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountnewpassword2_field_772750";
    item['en'] = "pick a password";
    item['sp'] = "Elije una contraseña\n";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountnewpassword2_textblock_597876";
    item['en'] = "We just sent a confirmation message to that address. Check your email to get going!\n\nClick the link in the message to activate your account, or enter the code below.\n\nCan’t find it? Check your spam or “other” box.";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountnewpassword2_button_568297";
    item['en'] = "Confirm Email";
    item['sp'] = "Confirmar correo electrónico";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountnewpassword2_fieldcopy_635588";
    item['en'] = "Confirmation code";
    item['sp'] = "Código de confirmación\n";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountemail_textblock2_656828";
    item['en'] = "Create Your Account";
    item['sp'] = "Crea tu Cuenta";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountnewpassword_textblock2_693298";
    item['en'] = "Set Your Password";
    item['sp'] = "Establece tu Contraseña";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountnewpassword_fieldcopy_371309";
    item['en'] = "pick a password";
    item['sp'] = "Elije una contraseña";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountnewpassword_fieldcopy_411280";
    item['en'] = "type it again";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountnewpassword_checkbox_11712";
    item['en'] = "Reveal Password";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountnewpassword2_textblock2_478878";
    item['en'] = "Confirm Your Email";
    item['sp'] = "Confirmar correo electrónico";
    
    item = {};
    this.items.push(item);
    item['key'] = "start_field_651083";
    item['en'] = "example@domain.com";
    
    item = {};
    this.items.push(item);
    item['key'] = "start_textblock_227182";
    item['en'] = "What’s your email address?";
    
    item = {};
    this.items.push(item);
    item['key'] = "start_textblockcopy_740929";
    item['en'] = "Are you new here?";
    
    item = {};
    this.items.push(item);
    item['key'] = "start_textblock2_685750";
    item['en'] = "Welcome to NestBox";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountemail_buttoncopy_452342";
    item['en'] = "< Back";
    item['sp'] = "De Vuelta";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountemail_textblock3_803106";
    item['en'] = " ";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountemail_text_496651";
    item['en'] = "example@domain.com";
    item['sp'] = "ejemplo@domain.com";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountemail_textblockcopy_208154";
    item['en'] = "(If you think you typed something wrong, just go back.)";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountnewpassword_buttoncopy_731877";
    item['en'] = "Next";
    item['sp'] = "Siguente";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountnewpassword_buttoncopy_246109";
    item['en'] = "< Back";
    item['sp'] = "De Vuelta";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountnewpassword_checkbox_392384";
    item['en'] = "Show password";
    item['sp'] = "Revelar contraseña";
    
    item = {};
    this.items.push(item);
    item['key'] = "signin_text_738611";
    item['en'] = "I forgot…";
    item['sp'] = "Olvidé";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountconfirmemail2_textblock2_600768";
    item['en'] = "Getting Started";
    item['sp'] = "Empezando";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountconfirmemail2_fieldcopy_932130";
    item['en'] = "Confirmation Code";
    item['sp'] = "Código de confirmación\n";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountconfirmemail2_textblock_179900";
    item['en'] = "Since you’re new here, we’d be happy to show you around and introduce you to features you might be handy. Hopefully we made it easy enough that there doesn’t need to be a tutorial, but a welcome tour might not be so bad, right?\n\nYou can always come back and check out the intro tour later.";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountconfirmemail2_button_408718";
    item['en'] = "Sure, let’s go!";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountconfirmemail2_buttoncopy_870101";
    item['en'] = "Skip for now";
    
    item = {};
    this.items.push(item);
    item['key'] = "firsttimetutorial2_buttoncopy_238707";
    item['en'] = "Skip for now";
    
    item = {};
    this.items.push(item);
    item['key'] = "firsttimetutorial2_textblock2_171996";
    item['en'] = "NestBox";
    item['sp'] = "Pantalla de Inicio";
    
    item = {};
    this.items.push(item);
    item['key'] = "firsttimetutorial2_textblock_970131";
    item['en'] = "Since you’re new here, we’d be happy to show you around and introduce you to features you might be handy. Hopefully we made it easy enough that there doesn’t need to be a tutorial, but a welcome tour might not be so bad, right?\n\nYou can always come back and check out the intro tour later.";
    
    item = {};
    this.items.push(item);
    item['key'] = "firsttimetutorial2_button_663631";
    item['en'] = "Sure, let’s go!";
    
    item = {};
    this.items.push(item);
    item['key'] = "home2_textblock2_161536";
    item['en'] = "Welcome Tour";
    
    item = {};
    this.items.push(item);
    item['key'] = "home2_button_1014459";
    item['en'] = "Next >";
    item['sp'] = "Siguente";
    
    item = {};
    this.items.push(item);
    item['key'] = "home2_buttoncopy_313196";
    item['en'] = "That’s enough";
    item['sp'] = "Eso es suficiente";
    
    item = {};
    this.items.push(item);
    item['key'] = "home2_textblock_484894";
    item['en'] = " ";
    
    item = {};
    this.items.push(item);
    item['key'] = "home2_textblockcopy_386929";
    item['en'] = "This will walk you through the main features of the home screen and hint at more advanced capabilities you should explore.";
    
    item = {};
    this.items.push(item);
    item['key'] = "signin2_textblock2_501797";
    item['en'] = "Password";
    
    item = {};
    this.items.push(item);
    item['key'] = "signin2_textblock_904934";
    item['en'] = "Ok, what’s your password?";
    
    item = {};
    this.items.push(item);
    item['key'] = "signin2_button_141670";
    item['en'] = "Sign In";
    
    item = {};
    this.items.push(item);
    item['key'] = "signin2_field_965805";
    item['en'] = "password";
    
    item = {};
    this.items.push(item);
    item['key'] = "signin_buttoncopy_588896";
    item['en'] = "Sign Up";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_text_772592";
    item['en'] = "Sign Out";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_button_1011593";
    item['en'] = "New button";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_button_80522";
    item['en'] = "New button";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountconfirmemail_textblockcopy_979231";
    item['en'] = "We just sent a confirmation message to that address. Check your email to get going!\n\nClick the link in the message to activate your account, or enter the code below.\n\nCan’t find it? Check your spam or “other” box.";
    
    item = {};
    this.items.push(item);
    item['key'] = "createaccountconfirmemail_text_168298";
    item['en'] = "Didn’t get your confirmation?";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_button_489163";
    item['en'] = "Birds";
    item['sp'] = "Aves";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy_943329";
    item['en'] = "Accounting";
    item['sp'] = "Contabilidad";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy2_1017342";
    item['en'] = "Feed/Water";
    item['sp'] = "Alimentar";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy3_108314";
    item['en'] = "Egg Production";
    item['sp'] = "Producción";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy4_75644";
    item['en'] = "Health";
    item['sp'] = "Salud";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy5_698053";
    item['en'] = "Cages/Flights";
    item['sp'] = "Enjaulamiento";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy6_182448";
    item['en'] = "Shipping";
    item['sp'] = "Envío";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy7_547890";
    item['en'] = "Genealogy";
    item['sp'] = "Genealogía";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy8_434911";
    item['en'] = "Calendar";
    item['sp'] = "Calendario";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy9_254421";
    item['en'] = "Chores";
    
    item = {};
    this.items.push(item);
    item['key'] = "signin_text_667432";
    item['en'] = "(Should this auto-detect?)";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy10_24235";
    item['en'] = "Reports";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy11_460735";
    item['en'] = "Inventory";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy12_138604";
    item['en'] = "Labels";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy13_603865";
    item['en'] = "Inventory";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy14_16410";
    item['en'] = "Labels";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy13_312118";
    item['en'] = "Labels";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy13_49486";
    item['en'] = "Genetics Tool";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy14_619016";
    item['en'] = "Address Book";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy15_845100";
    item['en'] = "Notifications";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy16_101904";
    item['en'] = "Privacy";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy17_633553";
    item['en'] = "My Team";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy18_368205";
    item['en'] = "My Profile";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy19_942977";
    item['en'] = "Help";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy20_1038752";
    item['en'] = "Reminders";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy21_816605";
    item['en'] = "Messages";
    
    item = {};
    this.items.push(item);
    item['key'] = "home_buttoncopy22_421119";
    item['en'] = "Classifieds";
    
    item = {};
    this.items.push(item);
    item['key'] = "signin2_textblock2_1006184";
    item['en'] = "Birds";
    
    item = {};
    this.items.push(item);
    item['key'] = "signin2_textblock_276645";
    item['en'] = "What’s your email address?";
    
    item = {};
    this.items.push(item);
    item['key'] = "signin2_button_629714";
    item['en'] = "Sign In";
    
    item = {};
    this.items.push(item);
    item['key'] = "signin2_field_373892";
    item['en'] = "example@domain.com";
    
    item = {};
    this.items.push(item);
    item['key'] = "signin2_buttoncopy_612194";
    item['en'] = "Sign Up";
    
    item = {};
    this.items.push(item);
    item['key'] = "signin2_text_77564";
    item['en'] = "(Should this auto-detect?)";
    
    item = {};
    this.items.push(item);
    item['key'] = "birds2_textblock2_889345";
    item['en'] = "Accounting";
    
    item = {};
    this.items.push(item);
    item['key'] = "accounting2_textblock2_373951";
    item['en'] = "Feed/Water";
    
    item = {};
    this.items.push(item);
    item['key'] = "feedwater2_textblock2_1041344";
    item['en'] = "Egg Production";
    
    item = {};
    this.items.push(item);
    item['key'] = "eggproduction2_textblock2_748086";
    item['en'] = "Health";
    
    item = {};
    this.items.push(item);
    item['key'] = "health2_textblock2_966711";
    item['en'] = "Caging";
    
    item = {};
    this.items.push(item);
    item['key'] = "caging2_textblock2_666675";
    item['en'] = "Shipping";
    
    item = {};
    this.items.push(item);
    item['key'] = "shipping2_textblock2_233024";
    item['en'] = "Genealogy";
    
    item = {};
    this.items.push(item);
    item['key'] = "genealogy2_textblock2_294421";
    item['en'] = "Calendar";
    
    item = {};
    this.items.push(item);
    item['key'] = "calendar_textblock_677747";
    item['en'] = "See everything that happens. View by Day, Week, or Month.\n\nFilter by:\nFeeding/Watering Events\nChores and Cleaning tasks\nShipping Arrivals/Departures\nClient Appointments\nLaying/Hatching Events\nSales Transactions/Purchases\nCage/Pairing changes\nReminders";
    
    item = {};
    this.items.push(item);
    item['key'] = "birds_textblock_1015602";
    item['en'] = "The list of all your birds. Sort by status, filter by current stock, babies, breeders, pets, etc.\n\nLots of info. Link to histories for feeding, production, health records, pairings, sales records, genetics, etc.\n\nPhotos and documentation";
    
    item = {};
    this.items.push(item);
    item['key'] = "accounting_textblock_826111";
    item['en'] = "Generate and pay Invoices\nPurchases\nSales\nLosses\nOwnership transfers\nEquipment\nExpendables\nAnything coming in or out";
    
    item = {};
    this.items.push(item);
    item['key'] = "feedwater_textblock_54997";
    item['en'] = "Assign feediung duties and check off completion.\n\nSpecify diet for individual birds or groups.\n\nSet feeding schedules.\n\nRecord feed brands and amounts. \n\nLog changes in diet.\n\nTrack supplies and consumption. ";
    
    item = {};
    this.items.push(item);
    item['key'] = "eggproduction_textblock_152248";
    item['en'] = "Log dates and number of eggs laid and hatch\n\nRecord parentage\n\nLay and hatch dates\n\nClutches\n\nEgg status, if they hatched or not\n\nProduction status over time\n\nSee all, or from specific pairings\n";
    
    item = {};
    this.items.push(item);
    item['key'] = "health_textblock_585596";
    item['en'] = "Vet records\n\nSexing\n\nDNA\n\nLog injuries or illnesses";
    
    item = {};
    this.items.push(item);
    item['key'] = "caging_textblock_855485";
    item['en'] = "Show where birds are housed\n\nBy property, building, room, cage, bucket, etc.\n\nList view or map/diagram view\n\nChanges in pairing or flights\n\n\n\n";
    
    item = {};
    this.items.push(item);
    item['key'] = "shipping_textblock_387662";
    item['en'] = "View and schedule flights\n\nEstimate Costs\n\nReview shipping requirements\n\nKeep records of birds sent and received";
    
    item = {};
    this.items.push(item);
    item['key'] = "genealogy_textblock_158411";
    item['en'] = "Track parentage and progeny\n\nHatched eggs automatically appear here\n\nAdding progeny here adds hatched eggs under production\n\nLink to siblibngs\n\nNote certaintly of relation or just assumed\n\nAutomatically flag impossible relations\n\nView family tree\n\nLink to mutation calculator";
    
    item = {};
    this.items.push(item);
    item['key'] = "calendar2_textblock_233321";
    item['en'] = "Everything that needs to be done, possibly combined with feeding and watering page.\n\nCage cleaning, repairs, grooming, etc. As to-do list and calendar items.\n\nTrack who has done what\n\nLog who completed and when";
    
    item = {};
    this.items.push(item);
    item['key'] = "calendar2_textblock2_394820";
    item['en'] = "Chores";
    
    item = {};
    this.items.push(item);
    item['key'] = "chores2_textblock_807663";
    item['en'] = "A personal to-do list of things like contacting clients, purchasing supplies, calling the airline, etc.\n\nPerhaps combined under the Chores page.";
    
    item = {};
    this.items.push(item);
    item['key'] = "chores2_textblock2_256060";
    item['en'] = "Reminders";
    
    item = {};
    this.items.push(item);
    item['key'] = "reminders2_textblock_594471";
    item['en'] = "Online sales of birds and supplies/equipment\n\nBrows listings or ad your own.\n\nItems from stock or inventory can be pushed here from those pages by clicking “List for Sale”\n\nManually edit ads, adjust prices, etc.";
    
    item = {};
    this.items.push(item);
    item['key'] = "reminders2_textblock2_319512";
    item['en'] = "Classifieds";
    
    item = {};
    this.items.push(item);
    item['key'] = "classifieds2_textblock_388802";
    item['en'] = "Charts, lists, and graphs of pretty much everything, all in one place\n\nUse presets, create your own, mix and match\n\nGenerate graphs, download selected data as spreadsheets, and explore trends";
    
    item = {};
    this.items.push(item);
    item['key'] = "classifieds2_textblock2_60912";
    item['en'] = "Reports";
    
    item = {};
    this.items.push(item);
    item['key'] = "reports2_textblock_312284";
    item['en'] = "All assets other than birds\n\nCages, vehicles, tools, food, medicine, cleaning supplies, etc\n\nAdd and remove items. Post things for sale and log purchases\n\nIf you own it or are borrowing something, it’s here\n\nCheck stock amounts, view inventory over time, and get alerts when running low\n\nCreate and scan barcodes and QR codes for asset tagging\n\nRecord feed batches to track contamination\n\nInsurance and tax reporting";
    
    item = {};
    this.items.push(item);
    item['key'] = "reports2_textblock2_43825";
    item['en'] = "Inventory";
    
    item = {};
    this.items.push(item);
    item['key'] = "genealogy2_textblock_117245";
    item['en'] = "Print labels and tags for tracking inventory, birds, and tasks. Sales labels and barcodes for merch\n\nGenerate from presets or design your own\n\nInclude barcodes or QR codes\n\nUse with the app, your own scanner, or third party\n\nLabel cages, flights, assets or equipment, etc.\n\nScan barcodes to pull up info, check of feeding/watering tasks, etc.";
    
    item = {};
    this.items.push(item);
    item['key'] = "genealogy2_textblock2_749883";
    item['en'] = "Labels";
    
    item = {};
    this.items.push(item);
    item['key'] = "labels2_textblock_354704";
    item['en'] = "Calculate genetics for birds based on their parentage\n\nGet predictions on liklihood of certain mutations\n\nExperiment with different hypothetical pairings\n\nInput desired outcomes and get reports on what pairs could achieve that result\n\nDrag and drop pairings";
    
    item = {};
    this.items.push(item);
    item['key'] = "labels2_textblock2_920491";
    item['en'] = "Genetics Calculator";
    
    item = {};
    this.items.push(item);
    item['key'] = "geneticscalculator2_textblock_803712";
    item['en'] = "Calculate genetics for birds based on their parentage\n\nGet predictions on liklihood of certain mutations\n\nExperiment with different hypothetical pairings\n\nInput desired outcomes and get reports on what pairs could achieve that result\n\nDrag and drop pairings";
    
    item = {};
    this.items.push(item);
    item['key'] = "geneticscalculator2_textblock2_1025122";
    item['en'] = "Genetics Calculator";
    
    item = {};
    this.items.push(item);
    item['key'] = "geneticscalculator3_textblock_388580";
    item['en'] = "Track clients, potential clients, vendors, etc.\n\nKeep track of contacts, shipping locations\n\nBasic CSM?";
    
    item = {};
    this.items.push(item);
    item['key'] = "geneticscalculator3_textblock2_662209";
    item['en'] = "Address Book";
    
    item = {};
    this.items.push(item);
    item['key'] = "addressbook2_textblock_938047";
    item['en'] = "All notices and alerts in one places\n\nCustomize what events you want notifications for\n\nSet alerts to go to email or text, push notificaitions on device";
    
    item = {};
    this.items.push(item);
    item['key'] = "addressbook2_textblock2_704194";
    item['en'] = "Notifications";
    
    item = {};
    this.items.push(item);
    item['key'] = "notifications2_textblock_197579";
    item['en'] = "All communication with clients, vendors, and other system users";
    
    item = {};
    this.items.push(item);
    item['key'] = "notifications2_textblock2_814926";
    item['en'] = "Messages";
    
    item = {};
    this.items.push(item);
    item['key'] = "messages2_textblock_328033";
    item['en'] = "The one-stop shop of all privacy settings\n\nGranular, fine detailed controls. Choose what is public, only shared with certain people, or completely private\n\nAssign different privacy levels to individual records, categories, and groups\n\nThis can be done on the items directly, or seen all together on this page";
    
    item = {};
    this.items.push(item);
    item['key'] = "messages2_textblock2_750959";
    item['en'] = "Privacy";
    
    item = {};
    this.items.push(item);
    item['key'] = "privacy2_textblock_662040";
    item['en'] = "Manage assistants, employees, and volunteers\n\nLink and manage accounts, create new ones, assign access permissions and tasks, set schedules, view profiles";
    
    item = {};
    this.items.push(item);
    item['key'] = "privacy2_textblock2_385506";
    item['en'] = "My Team";
    
    item = {};
    this.items.push(item);
    item['key'] = "myteam2_textblock_737528";
    item['en'] = "Set your preferences, contact details, avatar icon, mini bio, aviary information, etc\n\nSet or change passwords, billing info\n\nView account status, history, and usage";
    
    item = {};
    this.items.push(item);
    item['key'] = "myteam2_textblock2_122629";
    item['en'] = "My Profile";
    
    item = {};
    this.items.push(item);
    item['key'] = "myteam3_textblock_523738";
    item['en'] = "Tutorials, contact forms, email and phone\n\nApp support, billing support\n\nFeature requests, bug reports, suggestions";
    
    item = {};
    this.items.push(item);
    item['key'] = "myteam3_textblock2_530159";
    item['en'] = "Help";
    
    let storedItems = localStorage.getItem(this.id);
    if (storedItems != null) {
      this.items = JSON.parse(storedItems);
    }
  }

  addItem(item, options) {
    super.addItem(item, options);
    
    localStorage.setItem(this.id, JSON.stringify(this.items));
  }

  removeItem(item, options) {
    super.removeItem(item, options);
    
    localStorage.setItem(this.id, JSON.stringify(this.items));
  }

  replaceItemByRowIndex(idx, newItem, options) {
    super.replaceItemByRowIndex(idx, newItem, options);
    
    localStorage.setItem(this.id, JSON.stringify(this.items));
  }

  getStringsByLanguage = () => {
    let stringsByLang = {};
    for (let row of this.items) {
      const locKey = row.key;
      for (let key in row) {
        if (key === 'key')
          continue;
        let langObj = stringsByLang[key] || {};
        langObj[locKey] = row[key];
        stringsByLang[key] = langObj;
      }
    }
    return stringsByLang;
  }

}
