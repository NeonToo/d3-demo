<template>
    <svg id="map" :height="svgHeight" :width="svgWidth">
        <g class="gmap">
            <g class="glink" :transform="'translate(' + svgWidth / 2 + ',' + svgHeight / 2 + ')'"></g>
            <g class="gnode" :transform="'translate(' + svgWidth / 2 + ',' + svgHeight / 2 + ')'"></g>
        </g>
    </svg>
</template>

<script>
    import * as d3 from 'd3';

    export default {
        data() {
            return {
                svgHeight: 1300,
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
            const that = this;

            d3.json("./../data/map.json", function (error, data) {
                if (error) {
                    console.error(error);
                }
                that.mapData = data;
                that.renderMap();
                that.redraw([0, 0]);
            });
        },
        methods: {
            renderMap() {
                if (this.mapData) {
                    this.initMap();
                }
            },
            initMap() {
                const that = this;
                const svg = d3.select("#map");
                let gmap = svg.select(".gmap");
                let glink = gmap.select(".glink");
                let gnode = gmap.select(".gnode");
                const root = d3.hierarchy(this.mapData);
                const tree = d3.tree()
                    .size([360, 120])
                    .separation(function (node1, node2) {
                        return (node1.parent === node2.parent ? 1 : 2) / node1.depth;
                    });

                root.descendants().forEach(function (node) {
                    node.data.closed = false;
                    if (node.data.closed) {
                        that.toggle(node);
                    }
                });
                const zoom = d3.zoom()
                    .scaleExtent([.7, 2])
                    .translateExtent([[-.7 * that.svgWidth, -.7 * that.svgHeight], [1.7 * that.svgWidth, 1.7 * that.svgHeight]])
                    .on("zoom", function () {
                        const scale = "scale(" + d3.event.transform.k + ")",
                            translate = "translate(" + d3.event.transform.x + "," + d3.event.transform.y + ")";
                        gmap.attr("transform", `${scale} ${translate}`);
                    });
                svg.call(zoom);
                this.gmap = gmap;
                this.gnode = gnode;
                this.glink = glink;
                this.tree = tree;
                this.root = root;
            },
            redraw(coordinate) {
                this.tree(this.root);
                const that = this;
                /*
                （1） 计算节点和连线的位置
                */
                //应用布局，计算节点和连线
                const nodes = this.root.descendants();
                const links = this.root.links();
                //重新计算节点的y坐标
                nodes.forEach(function (node, index) {
//                    node.id = index;
                    node.y = 120 * node.depth;
                    node.pos = that.getPosition(node.x, node.y);
                });
//                links.forEach(function(link, index) {
//                    link.id = index;
//                });
                for (let i = 0; i < nodes.length; i++) {
                    nodes[i].id = this.b;
                    this.b++;
                }
                for (let j = 0; j < links.length; j++) {
                    links[j].id = this.M;
                    this.M++;
                }
                /*
                （2） 节点的处理
                */
                const xScale = d3.scaleLinear().domain([0, 180, 360]).range([1, .3, 1]),
                    depthScale = d3.scaleLinear().domain([0, 1, 5, 10]).range([13, 13, 6.5, 6.5]);
                //获取节点的update部分
                const nodeUpdate = this.gnode.selectAll(".node")
                    .data(nodes, function (node) {
                        return node.id;
                    });
                //获取节点的enter部分
                const nodeEnter = nodeUpdate.enter();
                //获取节点的exit部分
                const nodeExit = nodeUpdate.exit();
                //1. 节点的 Enter 部分的处理办法
                const enterNodes = nodeEnter.append("g")
                    .attr("class", "node")
                    .attr("transform", function () {
                        return "translate(" + coordinate[0] + "," + coordinate[1] + ")";
                    });
                enterNodes.append("circle")
                    .attr("r", 0)
                    .style("fill", function (node) {
                        let color = "";

                        if(node.depth > 1) {
                            color = d3.hsl(node.parent.color).brighter(.5);
                            color.l = xScale(node.x);
                        } else {
                            if(node.depth > 0) {
                                color = d3.hsl(node.x, 1, .5);
                            } else {
                                color = "#fff";
                            }
                        }
                        node.color = color + "";
                        return node.color + "";
                    })
                    .style("stroke-svgWidth", 2)
                    .style("stroke", "black")
                    .style("opacity", 0)
                    .on("click", function(node) {
                        that.toggle(node);
                        that.redraw(node.prevPos);
                    })
                    .on("mouseover", function(node) {
                        if(node.height > 0) {
                            d3.select(this).style("cursor", "pointer");
                        }
                    });
                enterNodes.append("text")
                    .attr("dominant-baseline", "text-before-edge")
                    .attr("text-anchor", "middle")
                    .attr("font-size", 12)
                    .attr("dy", 13)
                    .text(function (node) {
                        return node.data.name;
                    })
                    .style("fill-opacity", 1)
                    .style("cursor", "pointer")
                    .on("click", function(node) {
                        console.log(node.data.name);
                    });
                //2. 节点的 Update 部分的处理办法
                const updateNodes = enterNodes.merge(nodeUpdate)
                    .transition()
                    .duration(600)
                    .attr("transform", function (node) {
                        return "translate(" + node.pos[0] + "," + node.pos[1] + ")"
                    });
                updateNodes.select("circle")
                    .attr("r", function (node) {
                        return depthScale(node.depth);
                    })
                    .style("opacity", 1);
                updateNodes.select("text")
                    .attr("dy", function (node) {
                        return depthScale(node.depth);
                    })
                    .style("fill-opacity", 1);
                //3. 节点的 Exit 部分的处理办法
                const exitNodes = nodeExit.transition().duration(600)
                    .attr("transform", function () {
                        return "translate(" + coordinate[0] + "," + coordinate[1] + ")";
                    })
                    .remove();
                exitNodes.select("circle").style("opacity", 0).attr("r", 0);
                exitNodes.select("text").style("fill-opacity", 1);
                /*
                （3） 连线的处理
                */
                //获取连线的update部分
                const linkUpdate = this.glink.selectAll(".link")
                    .data(links, function (node) {
                        return node.target.id
                    });
                //获取连线的enter部分
                const linkEnter = linkUpdate.enter();
                //获取连线的exit部分
                const linkExit = linkUpdate.exit();
                //1. 连线的 Enter 部分的处理办法
                const enterLinks = linkEnter.append("path")
                    .attr("class", "link")
                    .attr("fill", "none")
                    .attr("stroke", "rgba(20,20,20,0.2)")
                    .attr("stroke-svgWidth", 1)
                    .attr("opacity", 0)
                    .attr("d", function () {
                        const source = {
                                x: coordinate[0],
                                y: coordinate[1]
                            },
                            target = {
                                x: coordinate[0],
                                y: coordinate[1]
                            };
                        return "M" + source.x + "," + source.y + "C" + (source.x + target.x) / 2 + "," + source.y + " " + (source.x + target.x) / 2 + "," + target.y + " " + target.x + "," + target.y;
                    });
                //2. 连线的 Update 部分的处理办法
                enterLinks.merge(linkUpdate).transition().duration(600)
                    .attr("opacity", 1)
                    .attr("d", function (node) {
                        const source = {
                                x: node.source.pos[0],
                                y: node.source.pos[1]
                            },
                            target = {
                                x: node.target.pos[0],
                                y: node.target.pos[1]
                            };
                        return "M" + source.x + "," + source.y + "L" + target.x + "," + target.y
                    });
                //3. 连线的 Exit 部分的处理办法
                linkExit.transition().duration(600)
                    .attr("opacity", 0)
                    .attr("d", function () {
                        const source = {
                                x: coordinate[0],
                                y: coordinate[1]
                            },
                            target = {
                                x: coordinate[0],
                                y: coordinate[1]
                            };
                        return "M" + source.x + "," + source.y + "L" + target.x + "," + target.y
                    })
                    .remove();
                /*
                （4） 保存当前的节点坐标，以备更新时使用
                */
                nodes.forEach(function (node) {
                    node.prevPos = [node.pos[0], node.pos[1]]
                });
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
            getPosition(x, y) {
                const radius = (x - 90) / 180 * Math.PI;
                return [y * Math.cos(radius), y * Math.sin(radius)];
            }
        }
    }
</script>