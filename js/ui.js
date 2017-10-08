'use strict';

$(function(){
	// Управление окном
	$('.window-buttons span').click(function () {
		if($(this).hasClass('minimizer'))
			require('electron').remote.BrowserWindow.getFocusedWindow().minimize();
		else
			window.close();
	});

	// Переключение основных пунктов меню
	$('.menu li span').click(function(){
		let parent = $(this).parent();
		$('.menu li, .content-item').removeClass('active');

		parent.add('.content-item[data-id="' + parent.attr('data-id') + '"]').addClass('active');
	});

	// Переключение списка - отображения иконок сервиса
	$('.list_type').click(function () {
		$(this).toggleClass('state');
	});

	// Переключение вкладок внутри сервиса || переключаем сразу во всех сервисах
	$(document).on('click', '.service-panel > ul li', function() {
		$('.service-panel > ul li, .in-service-panel').removeClass('active');
		$('.in-service-panel[data-id="' + $(this).attr('data-id') + '"]')
			.add('.service-panel > ul li[data-id="' + $(this).attr('data-id') + '"]').addClass('active');
	});

});

window.timeStr = function () {
	let date = new Date();
	let h = date.getHours(), i = date.getMinutes(), s = date.getSeconds();
	return (h > 9 ? h : '0' + h ) + ":" + (i > 9 ? i : '0' + i ) + ":" + (s > 9 ? s : '0' + s );
};