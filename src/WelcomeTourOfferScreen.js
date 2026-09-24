import React, { Component } from 'react';
import './App.css';

// UI framework component imports
import Button from 'muicss/lib/react/button';

export default class WelcomeTourOfferScreen extends Component {

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

  onClick_elButton = (ev) => {
    // Go to screen 'Welcome Tour'
    this.props.appActions.goToScreen('welcometour', { transitionId: 'fadeIn' });
  
  }
  
  
  onClick_elButtonCopy = (ev) => {
    // Go to screen 'Home'
    this.props.appActions.goToScreen('home', { transitionId: 'slideIn_right' });
  
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
    
    const style_elButton = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elButtonCopy = {
      display: 'block',
      color: '#fff',
      textAlign: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5000)',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    const style_elTextBlock = {
      color: 'rgba(0, 0, 0, 0.8500)',
      textAlign: 'left',
     };
    const style_elTextBlock2 = {
      color: 'rgba(0, 0, 0, 0.8500)',
      textAlign: 'left',
     };
    
    return (
      <div className="AppScreen WelcomeTourOfferScreen" style={baseStyle}>
        <div className="background">
          <div className="containerMinHeight elBackground" style={style_elBackground_outer}>
            <div className="appBg" style={style_elBackground} />
          </div>
        </div>
        
        <div className="layoutFlow" style={layoutFlowStyle}>
          <div className="elButton">
            <Button className="actionFont" style={style_elButton}  color="accent" onClick={this.onClick_elButton} >
              {this.props.locStrings.createaccountconfirmemail2_button_408718}
            </Button>
          </div>
          
          <div className="elButtonCopy">
            <Button className="actionFont" style={style_elButtonCopy} onClick={this.onClick_elButtonCopy} >
              {this.props.locStrings.createaccountconfirmemail2_buttoncopy_870101}
            </Button>
          </div>
        </div>
        
        <div className="screenFgContainer">
          <div className="foreground">
            <div className="baseFont elTextBlock" style={style_elTextBlock}>
              <div><div dangerouslySetInnerHTML={{__html: this.props.locStrings.createaccountconfirmemail2_textblock_179900.replace(/\n/g, '<br>')}}></div></div>
            </div>
            <div className="headlineFont elTextBlock2" style={style_elTextBlock2}>
              <div>{this.props.locStrings.createaccountconfirmemail2_textblock2_600768}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
}
