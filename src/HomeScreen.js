import React, { Component } from 'react';
import './App.css';

// UI framework component imports
import Button from 'muicss/lib/react/button';

export default class HomeScreen extends Component {

  // Properties used by this component:
  // appActions, deviceInfo

  constructor(props) {
    super(props);
    
    this.state = {
    };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  componentDidUpdate() {
  }

  onClick_elSignOut = (ev) => {
    // Go to screen 'Sign In'
    this.props.appActions.goToScreen('signin', { transitionId: 'fadeIn' });
  
  }
  
  
  onClick_elBirds = (ev) => {
    // Go to screen 'Birds'
    this.props.appActions.goToScreen('birds', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elAccounting = (ev) => {
    // Go to screen 'Accounting'
    this.props.appActions.goToScreen('accounting', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elFeedWater = (ev) => {
    // Go to screen 'Feed/Water'
    this.props.appActions.goToScreen('feedwater', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elEggProduction = (ev) => {
    // Go to screen 'Egg Production'
    this.props.appActions.goToScreen('eggproduction', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elHealth = (ev) => {
    // Go to screen 'Health'
    this.props.appActions.goToScreen('health', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elCagingFlights = (ev) => {
    // Go to screen 'Caging'
    this.props.appActions.goToScreen('caging', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elShipping = (ev) => {
    // Go to screen 'Shipping'
    this.props.appActions.goToScreen('shipping', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elGenealogy = (ev) => {
    // Go to screen 'Genealogy'
    this.props.appActions.goToScreen('genealogy', { transitionId: 'fadeIn' });
  
  }
  
  
  onClick_elCalendar = (ev) => {
    // Go to screen 'Calendar'
    this.props.appActions.goToScreen('calendar', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elChores = (ev) => {
    // Go to screen 'Chores'
    this.props.appActions.goToScreen('chores', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elReminders = (ev) => {
    // Go to screen 'Reminders'
    this.props.appActions.goToScreen('reminders', { transitionId: 'fadeIn' });
  
  }
  
  
  onClick_elClassifieds = (ev) => {
    // Go to screen 'Classifieds'
    this.props.appActions.goToScreen('classifieds', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elReports = (ev) => {
    // Go to screen 'Reports'
    this.props.appActions.goToScreen('reports', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elInventory = (ev) => {
    // Go to screen 'Inventory'
    this.props.appActions.goToScreen('inventory', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elLabels = (ev) => {
    // Go to screen 'Labels'
    this.props.appActions.goToScreen('labels', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elGenetics = (ev) => {
    // Go to screen 'Genetics Calculator'
    this.props.appActions.goToScreen('geneticscalculator', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elAddressBook = (ev) => {
    // Go to screen 'Address Book'
    this.props.appActions.goToScreen('addressbook', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elNotifications = (ev) => {
    // Go to screen 'Notifications'
    this.props.appActions.goToScreen('notifications', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elMessages = (ev) => {
    // Go to screen 'Messages'
    this.props.appActions.goToScreen('messages', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elPrivacy = (ev) => {
    // Go to screen 'Privacy'
    this.props.appActions.goToScreen('privacy', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elMyTeam = (ev) => {
    // Go to screen 'My Team'
    this.props.appActions.goToScreen('myteam', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elMyProfile = (ev) => {
    // Go to screen 'My Profile'
    this.props.appActions.goToScreen('myprofile', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elHelp = (ev) => {
    // Go to screen 'Help'
    this.props.appActions.goToScreen('help', { transitionId: 'slideIn_bottom' });
  
  }
  
  
  render() {
    let layoutFlowStyle = {};
    let baseStyle = {};
    if (this.props.transitionId && this.props.transitionId.length > 0 && this.props.atTopOfScreenStack && this.props.transitionForward) {
      baseStyle.animation = '0.25s ease-in-out '+this.props.transitionId;
    }
    if ( !this.props.atTopOfScreenStack) {
      layoutFlowStyle.height = '100vh';
      layoutFlowStyle.overflow = 'hidden';
    }
    
    const style_elBackground = {
      width: '100%',
      height: '100%',
     };
    const style_elBackground_outer = {
      backgroundColor: '#f6f6f6',
     };
    const style_elSignOut = {
      color: '#0093d5',
      textAlign: 'left',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elBirds = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elAccounting = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elFeedWater = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elEggProduction = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elHealth = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elCagingFlights = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elShipping = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elGenealogy = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elCalendar = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elChores = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elReminders = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elClassifieds = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elReports = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elInventory = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elLabels = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elGenetics = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elAddressBook = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elNotifications = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elMessages = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elPrivacy = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elMyTeam = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elMyProfile = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elHelp = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    const style_elTextBlock2 = {
      color: 'rgba(0, 0, 0, 0.8500)',
      textAlign: 'left',
     };
    
    return (
      <div className="AppScreen HomeScreen" style={baseStyle}>
        <div className="background">
          <div className="containerMinHeight elBackground" style={style_elBackground_outer}>
            <div className="appBg" style={style_elBackground} />
          </div>
        </div>
        
        <div className="layoutFlow" style={layoutFlowStyle}>
          <div className="elSignOut">
            <div className="baseFont" style={style_elSignOut} onClick={this.onClick_elSignOut} >
              <div>{this.props.locStrings.home_text_772592}</div>
            </div>
          </div>
          
          <div className="elBirds">
            <Button className="actionFont" style={style_elBirds}  color="accent" onClick={this.onClick_elBirds} >
              {this.props.locStrings.home_button_489163}
            </Button>
          </div>
          
          <div className="elAccounting">
            <Button className="actionFont" style={style_elAccounting}  color="accent" onClick={this.onClick_elAccounting} >
              {this.props.locStrings.home_buttoncopy_943329}
            </Button>
          </div>
          
          <div className="elFeedWater">
            <Button className="actionFont" style={style_elFeedWater}  color="accent" onClick={this.onClick_elFeedWater} >
              {this.props.locStrings.home_buttoncopy2_1017342}
            </Button>
          </div>
          
          <div className="elEggProduction">
            <Button className="actionFont" style={style_elEggProduction}  color="accent" onClick={this.onClick_elEggProduction} >
              {this.props.locStrings.home_buttoncopy3_108314}
            </Button>
          </div>
          
          <div className="elHealth">
            <Button className="actionFont" style={style_elHealth}  color="accent" onClick={this.onClick_elHealth} >
              {this.props.locStrings.home_buttoncopy4_75644}
            </Button>
          </div>
          
          <div className="elCagingFlights">
            <Button className="actionFont" style={style_elCagingFlights}  color="accent" onClick={this.onClick_elCagingFlights} >
              {this.props.locStrings.home_buttoncopy5_698053}
            </Button>
          </div>
          
          <div className="elShipping">
            <Button className="actionFont" style={style_elShipping}  color="accent" onClick={this.onClick_elShipping} >
              {this.props.locStrings.home_buttoncopy6_182448}
            </Button>
          </div>
          
          <div className="elGenealogy">
            <Button className="actionFont" style={style_elGenealogy}  color="accent" onClick={this.onClick_elGenealogy} >
              {this.props.locStrings.home_buttoncopy7_547890}
            </Button>
          </div>
          
          <div className="elCalendar">
            <Button className="actionFont" style={style_elCalendar}  color="accent" onClick={this.onClick_elCalendar} >
              {this.props.locStrings.home_buttoncopy8_434911}
            </Button>
          </div>
          
          <div className="elChores">
            <Button className="actionFont" style={style_elChores}  color="accent" onClick={this.onClick_elChores} >
              {this.props.locStrings.home_buttoncopy9_254421}
            </Button>
          </div>
          
          <div className="elReminders">
            <Button className="actionFont" style={style_elReminders}  color="accent" onClick={this.onClick_elReminders} >
              {this.props.locStrings.home_buttoncopy20_1038752}
            </Button>
          </div>
          
          <div className="elClassifieds">
            <Button className="actionFont" style={style_elClassifieds}  color="accent" onClick={this.onClick_elClassifieds} >
              {this.props.locStrings.home_buttoncopy22_421119}
            </Button>
          </div>
          
          <div className="elReports">
            <Button className="actionFont" style={style_elReports}  color="accent" onClick={this.onClick_elReports} >
              {this.props.locStrings.home_buttoncopy10_24235}
            </Button>
          </div>
          
          <div className="elInventory">
            <Button className="actionFont" style={style_elInventory}  color="accent" onClick={this.onClick_elInventory} >
              {this.props.locStrings.home_buttoncopy11_460735}
            </Button>
          </div>
          
          <div className="elLabels">
            <Button className="actionFont" style={style_elLabels}  color="accent" onClick={this.onClick_elLabels} >
              {this.props.locStrings.home_buttoncopy12_138604}
            </Button>
          </div>
          
          <div className="elGenetics">
            <Button className="actionFont" style={style_elGenetics}  color="accent" onClick={this.onClick_elGenetics} >
              {this.props.locStrings.home_buttoncopy13_49486}
            </Button>
          </div>
          
          <div className="elAddressBook">
            <Button className="actionFont" style={style_elAddressBook}  color="accent" onClick={this.onClick_elAddressBook} >
              {this.props.locStrings.home_buttoncopy14_619016}
            </Button>
          </div>
          
          <div className="elNotifications">
            <Button className="actionFont" style={style_elNotifications}  color="accent" onClick={this.onClick_elNotifications} >
              {this.props.locStrings.home_buttoncopy15_845100}
            </Button>
          </div>
          
          <div className="elMessages">
            <Button className="actionFont" style={style_elMessages}  color="accent" onClick={this.onClick_elMessages} >
              {this.props.locStrings.home_buttoncopy21_816605}
            </Button>
          </div>
          
          <div className="elPrivacy">
            <Button className="actionFont" style={style_elPrivacy}  color="accent" onClick={this.onClick_elPrivacy} >
              {this.props.locStrings.home_buttoncopy16_101904}
            </Button>
          </div>
          
          <div className="elMyTeam">
            <Button className="actionFont" style={style_elMyTeam}  color="accent" onClick={this.onClick_elMyTeam} >
              {this.props.locStrings.home_buttoncopy17_633553}
            </Button>
          </div>
          
          <div className="elMyProfile">
            <Button className="actionFont" style={style_elMyProfile}  color="accent" onClick={this.onClick_elMyProfile} >
              {this.props.locStrings.home_buttoncopy18_368205}
            </Button>
          </div>
          
          <div className="elHelp">
            <Button className="actionFont" style={style_elHelp}  color="accent" onClick={this.onClick_elHelp} >
              {this.props.locStrings.home_buttoncopy19_942977}
            </Button>
          </div>
        </div>
        
        <div className="screenFgContainer">
          <div className="foreground">
            <div className="headlineFont elTextBlock2" style={style_elTextBlock2}>
              <div>{this.props.locStrings.firsttimetutorial2_textblock2_171996}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
}
