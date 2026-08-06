import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

// Registers the 'ngauth' and 'ngauth_gcs' credentials providers on our
// Neuroglancer fork's defaultCredentialsManager. This is a side-effect-only
// module and it is NOT pulled in by the fork's main_module entry that
// react-neuroglancer builds on, so without this import any
// `gs+ngauth+https://` layer (e.g. a DSG-gated GCS bucket) fails at URL-parse
// time with `No registered credentials provider: "ngauth_gcs"`.
import '@janelia-flyem/neuroglancer/dist/module/neuroglancer/datasource/ngauth/register_credentials_provider';

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import store from './store';

const queryClient = new QueryClient();

ReactDOM.render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <App />
      {process.env.NODE_ENV !== 'production' ? <ReactQueryDevtools initialIsOpen={false} /> : ''}
    </QueryClientProvider>
  </Provider>,
  document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
