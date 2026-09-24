import React, { Component } from 'react';
import './App.css';
import btn_icon_371835 from './images/btn_icon_371835.png';

// UI framework component imports
import Button from 'muicss/lib/react/button';

export default class ClassifiedsScreen extends Component {

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

  onClick_elFab = (ev) => {
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
    const style_elTextBlock2 = {
      color: 'rgba(0, 0, 0, 0.8500)',
      textAlign: 'left',
     };
    
    const style_elFab = {
      display: 'block',
      color: '(null)',
      textAlign: 'left',
      cursor: 'pointer',
      pointerEvents: 'auto',
     };
    const style_elTextBlock = {
      color: 'rgba(0, 0, 0, 0.8500)',
      textAlign: 'left',
     };
    
    return (
      <div className="AppScreen ClassifiedsScreen" style={baseStyle}>
        <div className="background">
          <div className="containerMinHeight elBackground" style={style_elBackground_outer}>
            <div className="appBg" style={style_elBackground} />
          </div>
        </div>
        
        <div className="layoutFlow" style={layoutFlowStyle}>
          <div className="elTextBlock2">
            <div className="headlineFont" style={style_elTextBlock2}>
              <div>{this.props.locStrings.reminders2_textblock2_319512}</div>
            </div>
          </div>
          
          <div className="elFab">
            <Button className="actionFont" style={style_elFab}  variant="fab" color="accent" onClick={this.onClick_elFab} >
              <img src={btn_icon_371835} alt="" style={{width: '100%', marginTop: '4%'}} />
            </Button>
          </div>
        </div>
        
        <div className="screenFgContainer">
          <div className="foreground">
            <div className="baseFont elTextBlock" style={style_elTextBlock}>
              <div><div dangerouslySetInnerHTML={{__html: this.props.locStrings.reminders2_textblock_594471.replace(/\n/g, '<br>')}}></div></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
}
