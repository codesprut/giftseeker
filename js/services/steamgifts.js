'use strict';

class SteamGifts extends Seeker {

	constructor() {
		super();

		this.websiteUrl  = 'https://www.steamgifts.com/';
		this.authContent = 'Account';
		this.authLink    = "https://steamcommunity.com/openid/login?openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.mode=checkid_setup&openid.return_to=https%3A%2F%2Fwww.steamgifts.com%2F%3Flogin&openid.realm=https%3A%2F%2Fwww.steamgifts.com&openid.ns.sreg=http%3A%2F%2Fopenid.net%2Fextensions%2Fsreg%2F1.1&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select";
		this.wonsUrl     = "https://www.steamgifts.com/giveaways/won";

		super.init();
	}

}