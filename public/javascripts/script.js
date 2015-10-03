var formulas = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.nonword('formula', 'title'),
    queryTokenizer: Bloodhound.tokenizers.nonword,
    // prefetch: {
    //     url: '/formulas.json',
    //     cache: false
    // },
    remote: {
        url: '/query/%q',
        wildcard: '%q'
    }
});

$('.search').typeahead(null, {
    name: 'formulas',
    source: formulas,
    display: 'formula',
    limit: 6,
    templates: {
        suggestion: formulaTemplate
    }
});

$('.search').click(function() {
    if (window.innerWidth > 768) $('html, body').animate({
        scrollTop: $('.search').offset().top
    }, 400);
});

$('.search').bind('typeahead:render', function(_) {
    var $results = $('.tt-dataset.tt-dataset-formulas .row').clone();
    $results.appendTo($('#results').html(''));
});

$('.search').on('input', function(_) {
    if (!$(this).val().length) $('#results').html('');
});

function formulaTemplate(item) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(item.title));
    var title = div.innerHTML;
    return '<div class="row"><div class="col-md-12"><a class="unstyled" href="/formula/' + item.id + '"><div class="formula"><div class="title">' + title + '</div><div class="formula-math">' + item.html + '</div></div></a></div></div>';
}