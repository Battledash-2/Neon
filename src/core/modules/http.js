/**
 * ---------------------------
 * HTTP MODULE               |
 * ---------------------------
 * Make web requests and create servers;
 */

const parseUrl = (url)=>{
	if (url.startsWith('http')) url = url.slice('http://'.length+1);
	if (url.startsWith('https')) url = url.slice('https://'.length+1);

	let domain = url.includes('/') ? url.split('/')[0] : url;
	let path = url.includes('/') ? ('/' + (url.split('/').slice(1).join('/'))) : '/';
	let port = 80;

	if (domain.includes(':')) {
		port = parseInt(domain.split(':')[1])
		domain = domaind.split(':')[0];
	};

	if (isNaN(port)) throw new Error(`Port is not a valid number`);
	
	return {domain, path, port};
};

module.exports = {
	parse: parseUrl,
	http: require('http'),
	https: require('https'),
};