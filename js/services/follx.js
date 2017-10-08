'use strict';

class Follx extends Seeker {

	constructor() {
		super();
		this.websiteUrl  = 'https://follx.com';
		this.authLink    = 'https://follx.com/logIn';
		this.authContent = '/account';
		this.pointsLabel = 'Energy';

		this.neededCookies.push('Follx');

		super.init();
		this.log(this.constructor.name + ' Инициализирован');
	}

}