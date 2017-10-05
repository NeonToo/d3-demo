!function () {
    var n = d3.select("#mindmap-svg"),
        t = n.attr("width"),
        a = n.attr("height"),
        d = new MindMap;
    d.svg(n),
        d.size(t, a),
        d3.json("http://210.140.42.149:3000/graph.json",
            function (n, t) {
                n ? d3.json("./graph.json",
                    function (n, t) {
                        if (n) throw n;
                        d.data(t),
                            d.render()
                    }) : (d.data(t), d.render())
            })
}();