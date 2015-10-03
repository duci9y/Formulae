(function() {
	if (window.innerWidth < 768) return;
    if (window.CHITIKA === undefined) { window.CHITIKA = { 'units' : [] }; };
    var unit = {"calltype":"async[2]","publisher":"duci9y","width":160,"height":600,"sid":"Chitika Default","color_site_link":"ffffff","color_text":"cccccc","color_bg":"000000","color_button":"111111","color_button_text":"cccccc"};
    var placement_id = window.CHITIKA.units.length;
    window.CHITIKA.units.push(unit);
    document.write('<div id="chitikaAdBlock-' + placement_id + '"></div>');
}());