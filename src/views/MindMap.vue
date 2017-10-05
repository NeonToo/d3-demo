<template>
    <svg id="map" :height="svgHeight" :width="svgWidth">
        <g class="gmap"></g>
    </svg>
</template>

<script>
    import * as d3 from 'd3';

    export default {
        data() {
            return {
                svgHeight: 1000,
                svgWidth: 1300,
                mapData: {},
                svg: null,
                gnode: null,
                glink: null,
                tree: null,
                root: null,
                b: 0,
                M: 0
            };
        },
        mounted() {
            this.initMap();
        },
        methods: {
            initMap() {
                const that = this;

                d3.json("./../data/map.json", function (error, data) {
                    if (error) {
                        console.error(error);
                    }
                    that.mapData = data;
                    that.renderMap();
                    that.a([0, 0]);
                });
            },
            renderMap() {
                const that = this;
                const svg = d3.select("#map");
                let gmap = svg.select(".gmap");
                let glink = gmap.select(".glink");
                let gnode = gmap.select(".gnode");
                const root = d3.hierarchy(this.mapData);
                const tree = d3.tree().size([360, 120]).separation(function (node1, node2) {
                    return (node1.parent === node2.parent ? 1 : 2) / node1.depth;
                });

                root.descendants().forEach(function (node) {
                    node.data.closed = ("true" == node.data.closed);
                    node.data.closed && that.toggle(node);
                });
//                gmap.empty() && (gmap = svg.append("g").attr("class", "gmap"));
                if (gmap.empty()) {
                    gmap = svg.append("g").attr("class", "gmap");
                }
                if (glink.empty()) {
                    glink = gmap.append("g").attr("class", "glink");
                }
                if (gnode.empty()) {
                    gnode = gmap.append("g").attr("class", "gnode");
                }
                glink.attr("transform", "translate(" + that.svgWidth / 2 + "," + that.svgHeight / 2 + ")");
                gnode.attr("transform", "translate(" + that.svgWidth / 2 + "," + that.svgHeight / 2 + ")");
                const zoom = d3.zoom().scaleExtent([.7, 2])
                    .translateExtent([[-.7 * that.svgWidth, -.7 * that.svgHeight], [1.7 * that.svgWidth, 1.7 * that.svgHeight]])
                    .on("zoom", function () {
//                        console.log(d3.event.transform);
//                        console.log(d3.event.translate);
//                        console.log(d3.event.scale);
                        const t = "scale(" + d3.event.transform.k + ")",
                            e = "translate(" + d3.event.transform.x + "," + d3.event.transform.y + ")";
                        gmap.attr("transform", e + t);
                    });
                svg.call(zoom);
                this.gnode = gnode;
                this.glink = glink;
                this.tree = tree;
                this.root = root;
            },
            toggle(node) { // 'node' is the clicked one
                if (node.children) { // if has children
                    node._children = node.children; // save its children before clean
                    node.children = null;
                    node.data.closed = true;
                } else {
                    node.children = node._children; // reset its children
                    node._children = null;
                    node.data.closed = false;
                }
            },
            a(array) {
                const that = this;
                this.tree(this.root);
                const descendants = this.root.descendants();
                const links = this.root.links();

                descendants.forEach(function (descendant) {
                    descendant.y = 120 * descendant.depth;
                    descendant.pos = that.n(descendant.x, descendant.y);
                });
                for (let i = 0; i < descendants.length; i++) {
                    descendants[i].id = this.b;
                    this.b++;
                }
                for (let j = 0; j < links.length; j++) {
                    links[j].id = this.M;
                    this.M++;
                }
                let r = d3.scaleLinear().domain([0, 180, 360]).range([1, .3, 1]),
                    o = d3.scaleLinear().domain([0, 1, 5, 10]).range([13, 13, 6.5, 6.5]),
                    c = this.gnode.selectAll(".node").data(descendants, function (d) {
                        return d.id;
                    }),
                    enter = c.enter(),
                    exit = c.exit(),
                    f = enter.append("g").attr("class", "node").attr("transform", function () {
                        return "translate(" + array[0] + "," + array[1] + ")";
                    }).on("mousedown", function (d) {
                        d3.event.defaultPrevented || (that.toggle(d), that.a(d.prevPos));
                    }).on("mouseover", function () {
//                        d3.select(this).style("cursor", "pointer").select("text").style("fill-opacity", 1);
                    }).on("mouseout", function () {
//                        d3.select(this).select("text").transition(600).style("fill-opacity", 0);
                    });
                f.append("circle").attr("r", 0).style("fill", function (t) {
                    let e = "";
                    return t.depth > 1 ? (e = d3.hsl(t.parent.color), e = e.brighter(.5), e.l = r(t.x)) : e = t.depth > 0 ? d3.hsl(t.x, 1, .5) : "#FFFFFF",
                        t.color = e + "",
                    t.color + "";
                }).style("stroke-svgWidth", 2).style("stroke", "black").style("opacity", 0);
                f.append("text").attr("dominant-baseline", "text-before-edge")
                    .attr("text-anchor", "middle")
                    .attr("font-size", 12)
                    .attr("dy", 13)
                    .text(function (t) {
                        return t.data.name;
//                        let e = d3.rgb(t.color);
//                        return that.l(e.r, e.g, e.b);
                    }).style("fill-opacity", 1);

                let p = f.merge(c).transition().duration(600).attr("transform",
                    function (t) {
                        return "translate(" + t.pos[0] + "," + t.pos[1] + ")"
                    });
                p.select("circle").attr("r", function (t) {
                    return o(t.depth);
                }).style("opacity", 1);
                p.select("text").attr("dy", function (t) {
                    return o(t.depth);
                }).style("fill-opacity", 1);
                let m = exit.transition().duration(600).attr("transform", function () {
                    return "translate(" + array[0] + "," + array[1] + ")";
                }).remove();
                m.select("circle").style("opacity", 0).attr("r", 0);
                m.select("text").style("fill-opacity", 1);
                let w = this.glink.selectAll(".link").data(links, function (t) {
                        return t.target.id
                    }),
                    F = w.enter(),
                    z = w.exit();
                F.append("path").attr("class", "link")
                    .attr("fill", "none").attr("stroke", "rgba(20,20,20,0.2)")
                    .attr("stroke-svgWidth", 1).attr("opacity", 0)
                    .attr("d", function () {
                        let r = {
                            x: array[0],
                            y: array[1]
                        };
                        return that.s({
                            source: r,
                            target: r
                        })
                    }).merge(w).transition().duration(600).attr("opacity", 1)
                    .attr("d", function (t) {
                        let e = {
                                x: t.source.pos[0],
                                y: t.source.pos[1]
                            },
                            r = {
                                x: t.target.pos[0],
                                y: t.target.pos[1]
                            };
                        return "M" + e.x + "," + e.y + "L" + r.x + "," + r.y
                    });
                z.transition().duration(600).attr("opacity", 0)
                    .attr("d", function () {
                        const r = {
                                x: array[0],
                                y: array[1]
                            },
                            n = {
                                x: array[0],
                                y: array[1]
                            };
                        return "M" + r.x + "," + r.y + "L" + n.x + "," + n.y
                    }).remove();
                descendants.forEach(function (t) {
                    t.prevPos = [t.pos[0], t.pos[1]]
                });
            },
            n(x, y) {
                const radius = (x - 90) / 180 * Math.PI;
                return [y * Math.cos(radius), y * Math.sin(radius)];
            },
            s(t) {
                return "M" + t.source.x + "," + t.source.y + "C" + (t.source.x + t.target.x) / 2 + "," + t.source.y + " " + (t.source.x + t.target.x) / 2 + "," + t.target.y + " " + t.target.x + "," + t.target.y
            },
            l(t, e, r) {
                return this.c(t) + this.c(e) + this.c(r);
            },
            c(t) {
                return t = parseInt(t, 10),
                    isNaN(t) ? "00" : (t = Math.max(0, Math.min(t, 255)), "0123456789ABCDEF".charAt((t - t % 16) / 16) + "0123456789ABCDEF".charAt(t % 16));
            }
        }
    }
</script>