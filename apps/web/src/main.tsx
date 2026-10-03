import { render } from 'preact';
import './styles/base.css';
import './styles/search.css';
import { Page } from './components/Shell';
import { SearchApp } from './search/SearchApp';

render(<Page title={(t) => t.meta.searchTitle}><SearchApp /></Page>, document.getElementById('app')!);
