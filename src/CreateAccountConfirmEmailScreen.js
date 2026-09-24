import React, { Component } from 'react';
import './App.css';

// UI framework component imports
import Button from 'muicss/lib/react/button';

export default class CreateAccountConfirmEmailScreen extends Component {

  // Properties used by this component:
  // appActions, deviceInfo

  constructor(props) {
    super(props);
    
    this.state = {
      fieldCopy: '',
    };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  componentDidUpdate() {
  }

  textInputChanged_fieldCopy = (event) => {
    this.setState({fieldCopy: event.target.value});
  }
  
  onClick_elButton = (ev) => {
    // Go to screen 'Welcome Tour Offer'
    this.props.appActions.goToScreen('welcometouroffer', { transitionId: 'slideIn_right' });
  
  }
  
  
  onClick_elText = (ev) => {
    // Go to screen 'Sign In'
    this.props.appActions.goToScreen('signin', { transitionId: 'fadeIn' });
  
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
    
    const style_elFieldCopy = {
      display: 'block',
      backgroundColor: 'white',
      paddingLeft: '1rem',
      boxSizing: 'border-box', // ensures padding won't expand element's outer size
      pointerEvents: 'auto',
     };
    
    const style_elButton = {
      display: 'block',
      color: 'white',
      textAlign: 'center',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    const style_elText = {
      color: '#0093d5',
      textAlign: 'left',
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
      <div className="AppScreen CreateAccountConfirmEmailScreen" style={baseStyle}>
        <div className="background">
          <div className="containerMinHeight elBackground" style={style_elBackground_outer}>
            <div className="appBg" style={style_elBackground} />
          </div>
        </div>
        
        <div className="layoutFlow" style={layoutFlowStyle}>
          <div className="elFieldCopy">
            <input className="baseFont" style={style_elFieldCopy} type="text" placeholder={this.props.locStrings.createaccountnewpassword2_fieldcopy_635588} onChange={this.textInputChanged_fieldCopy} value={this.state.fieldCopy}  />
          </div>
          
          <div className="elButton">
            <Button className="actionFont" style={style_elButton}  color="accent" onClick={this.onClick_elButton} >
              {this.props.locStrings.createaccountnewpassword2_button_568297}
            </Button>
          </div>
          
          <div className="elText">
            <div className="baseFont" style={style_elText} onClick={this.onClick_elText} >
              <div>{this.props.locStrings.createaccountconfirmemail_text_168298}</div>
            </div>
          </div>
        </div>
        
        <div className="screenFgContainer">
          <div className="foreground">
            <div className="baseFont elTextBlock" style={style_elTextBlock}>
              <div><div dangerouslySetInnerHTML={{__html: this.props.locStrings.createaccountnewpassword2_textblock_597876.replace(/\n/g, '<br>')}}></div></div>
            </div>
            <div className="headlineFont elTextBlock2" style={style_elTextBlock2}>
              <div>{this.props.locStrings.createaccountnewpassword2_textblock2_478878}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
}
