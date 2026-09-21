// profile photo: click to cycle through photos
var profilePhotos = ['files/me_2024.jpg', 'files/me_2025a.jpg', 'files/me_2025b.jpg', 'files/me_2025c.jpg'];
var profileIndex = 0;

profilePhotos.forEach(function(src) { new Image().src = src; });

$('#profile-img').click(function() {
	var img = $(this);
	profileIndex = (profileIndex + 1) % profilePhotos.length;
	img.addClass('fading');
	setTimeout(function() {
		img.attr('src', profilePhotos[profileIndex]);
		img.removeClass('fading');
	}, 300);
});

// publications: toggle between first-author (selected) and all papers
$('.pub-toggle').click(function() {
	var showAll = $('#pub-list').toggleClass('show-all').hasClass('show-all');
	$('#pub-heading').text(showAll ? 'All Publications' : 'Selected Publications');
	$(this).text(showAll ? 'Show selected publications' : 'Show all publications');
	$(this).attr('aria-expanded', showAll);
});

// bibtex
$('.btn-bibtex').click(function() {
	$('#bibtex > code').html($(this).children('.bibtex-content').html());
	$('.btn-download').attr('href', $(this).children('a').attr('href'));
});
$('.btn-copy').click(function() {
	navigator.clipboard.writeText($('#bibtex > code').html());
});
