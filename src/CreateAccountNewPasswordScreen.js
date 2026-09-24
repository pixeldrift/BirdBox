import React, { Component } from 'react';
import './App.css';

// UI framework component imports
import Button from 'muicss/lib/react/button';
import Checkbox from 'muicss/lib/react/checkbox';

export default class CreateAccountNewPasswordScreen extends Component {

  // Properties used by this component:
  // appActions, deviceInfo

  constructor(props) {
    super(props);
    
    this.state = {
      checkbox: 'false',
      field: '',
      fieldCopy: '',
    };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  componentDidUpdate() {
  }

  onClick_elButton = (ev) => {
    // Go to screen 'Create Account - Confirm Email'
    this.props.appActions.goToScreen('createaccountconfirmemail', { transitionId: 'slideIn_right' });
  
  }
  
  
  checkboxChanged_checkbox = (event) => {
    this.setState({checkbox: (event.target.checked ? 'true' : 'false')});
  }
  
  textInputChanged_field = (event) => {
    this.setState({field: event.target.value});
  }
  
  textInputChanged_fieldCopy = (event) => {
    this.setState({fieldCopy: event.target.value});
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
    
    let checked_checkbox = this.state.checkbox;
    
    const style_elCheckbox = {
      pointerEvents: 'auto',
     };
    
    const style_elField = {
      display: 'block',
      backgroundColor: 'white',
      paddingLeft: '1rem',
      boxSizing: 'border-box', // ensures padding won't expand element's outer size
      pointerEvents: 'auto',
     };
    
    const style_elFieldCopy = {
      display: 'block',
      backgroundColor: 'white',
      paddingLeft: '1rem',
      boxSizing: 'border-box', // ensures padding won't expand element's outer size
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
    
    const style_elButtonCopy = {
      display: 'block',
      color: '#fff',
      textAlign: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5000)',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    
    return (
      <div className="AppScreen CreateAccountNewPasswordScreen" style={baseStyle}>
        <div className="background">
          <div className="containerMinHeight elBackground" style={style_elBackground_outer}>
            <div className="appBg" style={style_elBackground} />
          </div>
        </div>
        
        <div className="layoutFlow" style={layoutFlowStyle}>
          <div className="elButton">
            <Button className="actionFont" style={style_elButton}  color="accent" onClick={this.onClick_elButton} >
              {this.props.locStrings.createaccountemail2_button_871163}
            </Button>
          </div>
          
          <div className="elCheckbox">
            <Checkbox className="baseFont" style={style_elCheckbox}  label={this.props.locStrings.createaccountnewpassword_checkbox_392384} onChange={this.checkboxChanged_checkbox} checked={checked_checkbox === 'true' || checked_checkbox === true || ''+checked_checkbox === '1'}  />
          </div>
          
          <div className="elField">
            <input className="baseFont" style={style_elField} type="text" placeholder={this.props.locStrings.createaccountpassword_field_61852} onChange={this.textInputChanged_field} value={this.state.field}  />
          </div>
          
          <div className="elFieldCopy">
            <input className="baseFont" style={style_elFieldCopy} type="text" placeholder={this.props.locStrings.createaccountnewpassword_fieldcopy_411280} onChange={this.textInputChanged_fieldCopy} value={this.state.fieldCopy}  />
          </div>
        </div>
        
        <div className="screenFgContainer">
          <div className="foreground">
            <div className="baseFont elTextBlock" style={style_elTextBlock}>
              <div>{this.props.locStrings.createaccountemail2_textblock_1012589}</div>
            </div>
            <div className="headlineFont elTextBlock2" style={style_elTextBlock2}>
              <div>{this.props.locStrings.createaccountnewpassword_textblock2_693298}</div>
            </div>
            <Button className="actionFont elButtonCopy" style={style_elButtonCopy} onClick={this.onClick_elButtonCopy} >
              {this.props.locStrings.createaccountnewpassword_buttoncopy_246109}
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
}
