(function() {
	if (window.innerWidth < 768) return;
	if (window.CHITIKA === undefined) { window.CHITIKA = { 'units' : [] }; };
	var unit = {"calltype":"async[2]","publisher":"duci9y","width":300,"height":250,"sid":"Chitika Default"};
	var placement_id = window.CHITIKA.units.length;
	window.CHITIKA.units.push(unit);
	document.write('<div id="chitikaAdBlock-' + placement_id + '"></div>');
}());