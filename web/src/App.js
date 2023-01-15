import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { useState, useEffect, Fragment } from 'react';
import Header from './Header';
import Overview from './Overview';
import Files from './Files';
import Calendar from './Calendar';
import Login from './Login';

const PageSwitcher = ({index, setSwitcher}) => {
  let component = null;
  switch(index) {
    case 0:
      component = <Login setSwitcher={setSwitcher}/>
      break;
    case 1:
      component = <Overview />;
      break;
    case 2:
      component = <Files />;
      break;
    case 3:
      component = <Calendar />;
      break;
    default:
      component = <Login setSwitcher={setSwitcher}/>;
  }
  return component;
}

const App = () => {
  const [pageSwitcher, setSwitcher] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  useEffect(()=> {
    if (currentPageIndex != pageSwitcher) {
      setCurrentPageIndex(pageSwitcher)
    }
  }, [pageSwitcher]);

  useEffect(()=> {
    let credentials = localStorage.getItem('credentials');
    if (credentials != null) {
      setSwitcher(1);
    }
  }, []);

  return(
    <div>
      {
        currentPageIndex != 0 && <Header setSwitcher={setSwitcher}/>
      }
      <PageSwitcher index={currentPageIndex} setSwitcher={setSwitcher}/>
    </div>
  )
}

export default App;