import React, { Component } from 'react';
import './App.css';

// UI framework component imports
import Button from 'muicss/lib/react/button';

export default class CreateAccountEmailScreen extends Component {

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
    // Go to screen 'Create Account - New Password'
    this.props.appActions.goToScreen('createaccountnewpassword', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elButtonCopy = (ev) => {
    // Go back in screen navigation history
    this.props.appActions.goBack();
  
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
    const style_elText = {
      fontSize: 17.1,
      color: 'rgba(0, 0, 0, 0.8500)',
      textAlign: 'left',
     };
    const style_elTextBlock = {
      color: 'rgba(0, 0, 0, 0.8500)',
      textAlign: 'left',
     };
    
    const style_elButtonCopy = {
      display: 'block',
      color: '#fff',
      textAlign: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5000)',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    const style_elTextBlock2 = {
      color: 'rgba(0, 0, 0, 0.8500)',
      textAlign: 'left',
     };
    const style_elTextBlockCopy = {
      color: 'rgba(0, 0, 0, 0.8500)',
      textAlign: 'left',
     };
    
    return (
      <div className="AppScreen CreateAccountEmailScreen" style={baseStyle}>
        <div className="background">
          <div className="containerMinHeight elBackground" style={style_elBackground_outer}>
            <div className="appBg" style={style_elBackground} />
          </div>
        </div>
        
        <div className="screenFgContainer">
          <div className="foreground">
            <Button className="actionFont elButton" style={style_elButton}  color="accent" onClick={this.onClick_elButton} >
              {this.props.locStrings.start2_button_531775}
            </Button>
            <div className="systemFontBoldItalic  elText" style={style_elText}>
              <div>{this.props.locStrings.createaccountemail_text_496651}</div>
            </div>
            <div className="baseFont elTextBlock" style={style_elTextBlock}>
              <div>{this.props.locStrings.createaccount_textblock_345476}</div>
            </div>
            <Button className="actionFont elButtonCopy" style={style_elButtonCopy} onClick={this.onClick_elButtonCopy} >
              {this.props.locStrings.createaccountemail_buttoncopy_452342}
            </Button>
            <div className="headlineFont elTextBlock2" style={style_elTextBlock2}>
              <div>{this.props.locStrings.createaccountemail_textblock2_656828}</div>
            </div>
            <div className="baseFont elTextBlockCopy" style={style_elTextBlockCopy}>
              <div>{this.props.locStrings.createaccountemail_textblockcopy_208154}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
}
