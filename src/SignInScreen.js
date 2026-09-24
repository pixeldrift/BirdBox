import React, { Component } from 'react';
import './App.css';

// UI framework component imports
import Button from 'muicss/lib/react/button';

export default class SignInScreen extends Component {

  // Properties used by this component:
  // appActions, deviceInfo

  constructor(props) {
    super(props);
    
    this.state = {
      field: '',
    };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  componentDidUpdate() {
  }

  onClick_elButton = (ev) => {
    // Go to screen 'Enter Password'
    this.props.appActions.goToScreen('enterpassword', { transitionId: 'fadeIn' });
  
  }
  
  
  textInputChanged_field = (event) => {
    this.setState({field: event.target.value});
  }
  
  onClick_elButtonCopy = (ev) => {
    // Go to screen 'Create Account - Email'
    this.props.appActions.goToScreen('createaccountemail', { transitionId: 'fadeIn' });
  
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
    const style_elTextBlock2 = {
      color: 'rgba(0, 0, 0, 0.8500)',
      textAlign: 'left',
     };
    const style_elTextBlock = {
      color: 'rgba(0, 0, 0, 0.8500)',
      textAlign: 'left',
     };
    
    const style_elButton = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    const style_elField = {
      display: 'block',
      backgroundColor: 'white',
      paddingLeft: '1rem',
      boxSizing: 'border-box', // ensures padding won't expand element's outer size
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
    const style_elText = {
      color: '#bee9ee',
      textAlign: 'left',
     };
    
    return (
      <div className="AppScreen SignInScreen" style={baseStyle}>
        <div className="background">
          <div className="containerMinHeight elBackground" style={style_elBackground_outer}>
            <div className="appBg" style={style_elBackground} />
          </div>
        </div>
        
        <div className="layoutFlow" style={layoutFlowStyle}>
          <div className="elTextBlock2">
            <div className="headlineFont" style={style_elTextBlock2}>
              <div>{this.props.locStrings.start_textblock2_685750}</div>
            </div>
          </div>
          
          <div className="elTextBlock">
            <div className="actionFont" style={style_elTextBlock}>
              <div>{this.props.locStrings.start_textblock_227182}</div>
            </div>
          </div>
          
          <div className="elButton">
            <Button className="actionFont" style={style_elButton}  color="accent" onClick={this.onClick_elButton} >
              {this.props.locStrings.start_button_650337}
            </Button>
          </div>
          
          <div className="elField">
            <input className="baseFont" style={style_elField} type="text" placeholder={this.props.locStrings.start_field_651083} onChange={this.textInputChanged_field} value={this.state.field}  />
          </div>
          
          <div className="elButtonCopy">
            <Button className="actionFont" style={style_elButtonCopy} onClick={this.onClick_elButtonCopy} >
              {this.props.locStrings.signin_buttoncopy_588896}
            </Button>
          </div>
          
          <div className="elText">
            <div className="baseFont" style={style_elText}>
              <div>{this.props.locStrings.signin_text_667432}</div>
            </div>
          </div>
        </div>
        
      </div>
    )
  }
  
}
