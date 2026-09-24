import React, { Component } from 'react';
import LocalizedStrings from 'react-localization';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import * as util from 'util';
import './App.css';
import WelcomeTourScreen from './WelcomeTourScreen.js';
import WelcomeTourOfferScreen from './WelcomeTourOfferScreen.js';
import AccountingScreen from './AccountingScreen.js';
import FeedWaterScreen from './FeedWaterScreen.js';
import GenealogyScreen from './GenealogyScreen.js';
import ClassifiedsScreen from './ClassifiedsScreen.js';
import PrivacyScreen from './PrivacyScreen.js';
import EggProductionScreen from './EggProductionScreen.js';
import CalendarScreen from './CalendarScreen.js';
import ReportsScreen from './ReportsScreen.js';
import AddressBookScreen from './AddressBookScreen.js';
import ShippingScreen from './ShippingScreen.js';
import GeneticsCalculatorScreen from './GeneticsCalculatorScreen.js';
import MessagesScreen from './MessagesScreen.js';
import MyTeamScreen from './MyTeamScreen.js';
import CreateAccountConfirmEmailScreen from './CreateAccountConfirmEmailScreen.js';
import BirdsScreen from './BirdsScreen.js';
import HealthScreen from './HealthScreen.js';
import CagingScreen from './CagingScreen.js';
import ChoresScreen from './ChoresScreen.js';
import RemindersScreen from './RemindersScreen.js';
import InventoryScreen from './InventoryScreen.js';
import LabelsScreen from './LabelsScreen.js';
import NotificationsScreen from './NotificationsScreen.js';
import MyProfileScreen from './MyProfileScreen.js';
import HelpScreen from './HelpScreen.js';
import HomeScreen from './HomeScreen.js';
import CreateAccountNewPasswordScreen from './CreateAccountNewPasswordScreen.js';
import EnterPasswordScreen from './EnterPasswordScreen.js';
import CreateAccountEmailScreen from './CreateAccountEmailScreen.js';
import SignInScreen from './SignInScreen.js';
import Login1Screen from './Login1Screen.js';
import DataSheet_localizationSheet from './DataSheet_localizationSheet.js';


class App extends Component {
  constructor(props) {
    super(props);

    this.dataSheets = {};
    this.dataSheets['localizationSheet'] = new DataSheet_localizationSheet('localizationSheet', this.dataSheetDidUpdate);
    this.dataSheetLoaded = {};

    this.dataSlots = {};
    this.dataSlots['ds_activeLang'] = "en";

    this.updateLocalizationFromDataSheet(this.dataSheets['localizationSheet']);

    this.state = {
      screenTransitionForward: true,
    }

  }

  windowDidResize = () => {
    let w = window.innerWidth;
    let formatId;
    if (w < 576) formatId = 'narrow-phone';
    else if (w < 768) formatId = 'wide-phone';
    else if (w < 1024) formatId = 'narrow-tablet';
    else formatId = 'wide-tablet';
    if (formatId !== this.state.screenFormatId) {
      this.setState({screenFormatId: formatId});
    }
  }

  componentDidMount() {
    this.windowDidResize();
    window.addEventListener('resize', this.windowDidResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.windowDidResize);
  }

  isLoading() {
    return this.state.loading;
  }

  goToScreen = (screenId, props) => {
    // This method is the default implementation and could be customized by a navigation plugin.
    this.props.history.push('/'+screenId, {...props, appActions: null, locStrings: null, dataSheets: null});
    window.scrollTo(0, 0);
  }

  goBack = () => {
    // This method is the default implementation and could be customized by a navigation plugin.
    this.props.history.goBack();
  }

  getDataSheet = (sheetId) => {
    // This method is the default implementation and could be customized by a state management plugin.
    return this.dataSheets[sheetId];
  }

  addToDataSheet = (sheetId, newRow, actionId) => {
    // This method is the default implementation and could be customized by a state management plugin.
    let sheet = this.dataSheets[sheetId];
    if (sheet && newRow) {
      sheet.addItem(newRow, this['serviceOptions_'+sheetId] || {});
    }
    this.setState({});
  }

  updateInDataSheet = (sheetId, row, actionId) => {
    // This method is the default implementation and could be customized by a state management plugin.
    let sheet = this.dataSheets[sheetId];
    if (sheet && row) {
      sheet.replaceItemByKey(row.key, row, this['serviceOptions_'+sheetId] || {});
      this.setState({});
    }
  }

  removeFromDataSheet = (sheetId, row) => {
    let sheet = this.dataSheets[sheetId];
    if (sheet && row) {
      sheet.removeItem(row, this['serviceOptions_'+sheetId] || {});
    }
    this.setState({});
  }

  updateDataSlot = (slotId, value, actionId) => {
    // This method is the default implementation and could be customized by a state management plugin.
    this.dataSlots[slotId] = value;
    if (slotId === 'ds_activeLang') {
      this.locStrings.setLanguage(value);
    }
    this.setState({});
  }

  dataSheetDidUpdate = (dataSheet) => {
    // This method is the default implementation and could be customized by a state management plugin.
    this.setState({});
  }

  updateLocalizationFromDataSheet = (dataSheet) => {
    const stringsObj = dataSheet.getStringsByLanguage();
    if (stringsObj && Object.keys(stringsObj).length > 0) {
      this.locStrings = new LocalizedStrings(stringsObj);
    } else {
      this.locStrings = new LocalizedStrings({en: {}});
    }
    this.locStrings.setLanguage(this.dataSlots['ds_activeLang']);
  }

  render() {
    let makeElementForScreen = (screenId, baseProps, atTop, forward) => {
      let screenProps = {
        ...baseProps,
        atTopOfScreenStack: atTop,
        transitionForward: forward,
        appActions: this,
        dataSheets: this.dataSheets,
        locStrings: this.locStrings,
        deviceInfo: {
          screenFormatId: this.state.screenFormatId
        },
        'ds_activeLang': this.dataSlots['ds_activeLang'],
      };
      switch (screenId) {
        default:
          return null;
        case 'welcometour':
          return (<WelcomeTourScreen {...screenProps} />)
        case 'welcometouroffer':
          return (<WelcomeTourOfferScreen {...screenProps} />)
        case 'accounting':
          return (<AccountingScreen {...screenProps} />)
        case 'feedwater':
          return (<FeedWaterScreen {...screenProps} />)
        case 'genealogy':
          return (<GenealogyScreen {...screenProps} />)
        case 'classifieds':
          return (<ClassifiedsScreen {...screenProps} />)
        case 'privacy':
          return (<PrivacyScreen {...screenProps} />)
        case 'eggproduction':
          return (<EggProductionScreen {...screenProps} />)
        case 'calendar':
          return (<CalendarScreen {...screenProps} />)
        case 'reports':
          return (<ReportsScreen {...screenProps} />)
        case 'addressbook':
          return (<AddressBookScreen {...screenProps} />)
        case 'shipping':
          return (<ShippingScreen {...screenProps} />)
        case 'geneticscalculator':
          return (<GeneticsCalculatorScreen {...screenProps} />)
        case 'messages':
          return (<MessagesScreen {...screenProps} />)
        case 'myteam':
          return (<MyTeamScreen {...screenProps} />)
        case 'createaccountconfirmemail':
          return (<CreateAccountConfirmEmailScreen {...screenProps} />)
        case 'birds':
          return (<BirdsScreen {...screenProps} />)
        case 'health':
          return (<HealthScreen {...screenProps} />)
        case 'caging':
          return (<CagingScreen {...screenProps} />)
        case 'chores':
          return (<ChoresScreen {...screenProps} />)
        case 'reminders':
          return (<RemindersScreen {...screenProps} />)
        case 'inventory':
          return (<InventoryScreen {...screenProps} />)
        case 'labels':
          return (<LabelsScreen {...screenProps} />)
        case 'notifications':
          return (<NotificationsScreen {...screenProps} />)
        case 'myprofile':
          return (<MyProfileScreen {...screenProps} />)
        case 'help':
          return (<HelpScreen {...screenProps} />)
        case 'home':
          return (<HomeScreen {...screenProps} />)
        case 'createaccountnewpassword':
          return (<CreateAccountNewPasswordScreen {...screenProps} />)
        case 'enterpassword':
          return (<EnterPasswordScreen {...screenProps} />)
        case 'createaccountemail':
          return (<CreateAccountEmailScreen {...screenProps} />)
        case 'signin':
          return (<SignInScreen {...screenProps} />)
        case 'login1':
          return (<Login1Screen {...screenProps} />)
      }
    }

    return (
      <div className="App">
        <Switch>
          <Route path="/" render={(props) => makeElementForScreen('signin', props.location.state, true, true)} exact />
          <Route path="/welcometour" render={(props) => {
            return makeElementForScreen('welcometour', props.location.state, true, true);
          }} />
          <Route path="/welcometouroffer" render={(props) => {
            return makeElementForScreen('welcometouroffer', props.location.state, true, true);
          }} />
          <Route path="/accounting" render={(props) => {
            return makeElementForScreen('accounting', props.location.state, true, true);
          }} />
          <Route path="/feedwater" render={(props) => {
            return makeElementForScreen('feedwater', props.location.state, true, true);
          }} />
          <Route path="/genealogy" render={(props) => {
            return makeElementForScreen('genealogy', props.location.state, true, true);
          }} />
          <Route path="/classifieds" render={(props) => {
            return makeElementForScreen('classifieds', props.location.state, true, true);
          }} />
          <Route path="/privacy" render={(props) => {
            return makeElementForScreen('privacy', props.location.state, true, true);
          }} />
          <Route path="/eggproduction" render={(props) => {
            return makeElementForScreen('eggproduction', props.location.state, true, true);
          }} />
          <Route path="/calendar" render={(props) => {
            return makeElementForScreen('calendar', props.location.state, true, true);
          }} />
          <Route path="/reports" render={(props) => {
            return makeElementForScreen('reports', props.location.state, true, true);
          }} />
          <Route path="/addressbook" render={(props) => {
            return makeElementForScreen('addressbook', props.location.state, true, true);
          }} />
          <Route path="/shipping" render={(props) => {
            return makeElementForScreen('shipping', props.location.state, true, true);
          }} />
          <Route path="/geneticscalculator" render={(props) => {
            return makeElementForScreen('geneticscalculator', props.location.state, true, true);
          }} />
          <Route path="/messages" render={(props) => {
            return makeElementForScreen('messages', props.location.state, true, true);
          }} />
          <Route path="/myteam" render={(props) => {
            return makeElementForScreen('myteam', props.location.state, true, true);
          }} />
          <Route path="/createaccountconfirmemail" render={(props) => {
            return makeElementForScreen('createaccountconfirmemail', props.location.state, true, true);
          }} />
          <Route path="/birds" render={(props) => {
            return makeElementForScreen('birds', props.location.state, true, true);
          }} />
          <Route path="/health" render={(props) => {
            return makeElementForScreen('health', props.location.state, true, true);
          }} />
          <Route path="/caging" render={(props) => {
            return makeElementForScreen('caging', props.location.state, true, true);
          }} />
          <Route path="/chores" render={(props) => {
            return makeElementForScreen('chores', props.location.state, true, true);
          }} />
          <Route path="/reminders" render={(props) => {
            return makeElementForScreen('reminders', props.location.state, true, true);
          }} />
          <Route path="/inventory" render={(props) => {
            return makeElementForScreen('inventory', props.location.state, true, true);
          }} />
          <Route path="/labels" render={(props) => {
            return makeElementForScreen('labels', props.location.state, true, true);
          }} />
          <Route path="/notifications" render={(props) => {
            return makeElementForScreen('notifications', props.location.state, true, true);
          }} />
          <Route path="/myprofile" render={(props) => {
            return makeElementForScreen('myprofile', props.location.state, true, true);
          }} />
          <Route path="/help" render={(props) => {
            return makeElementForScreen('help', props.location.state, true, true);
          }} />
          <Route path="/home" render={(props) => {
            return makeElementForScreen('home', props.location.state, true, true);
          }} />
          <Route path="/createaccountnewpassword" render={(props) => {
            return makeElementForScreen('createaccountnewpassword', props.location.state, true, true);
          }} />
          <Route path="/enterpassword" render={(props) => {
            return makeElementForScreen('enterpassword', props.location.state, true, true);
          }} />
          <Route path="/createaccountemail" render={(props) => {
            return makeElementForScreen('createaccountemail', props.location.state, true, true);
          }} />
          <Route path="/signin" render={(props) => {
            return makeElementForScreen('signin', props.location.state, true, true);
          }} />
          <Route path="/login1" render={(props) => {
            return makeElementForScreen('login1', props.location.state, true, true);
          }} />
        </Switch>
      </div>
    );
  }
}
export default withRouter(App)
