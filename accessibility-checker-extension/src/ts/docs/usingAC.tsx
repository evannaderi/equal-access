/******************************************************************************
  Copyright:: 2020- IBM, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*****************************************************************************/

import * as React from 'react';
import ReactDOM from 'react-dom';
// import {  Theme } from "@carbon/react";
import { BrowserDetection } from "../util/browserDetection";
import "../styles/index.scss";
import UsingACApp from './UsingACApp';

class PageApp extends React.Component<{}, {}> {
    render() {
        return <UsingACApp />
    }
}

let element = document.getElementById('pageapp-root');
element?.setAttribute("class", BrowserDetection.isDarkMode()?"cds--g100":"white")

ReactDOM.render(<PageApp />
    , element);
    