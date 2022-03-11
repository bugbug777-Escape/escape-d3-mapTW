// API
const county_geomap_api =
  "https://hexschool.github.io/tw_revenue/taiwan-geomap.json";
const county_revenue_api =
  "https://hexschool.github.io/tw_revenue/tw_revenue.json";

function ColorToHex(color) {
  const hexadecimal = color.toString(16);
  return hexadecimal.length == 1 ? "0" + hexadecimal : hexadecimal;
}

function ConvertRGBtoHex(rbg) {
  const matchColors = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/;
  const match = matchColors.exec(rbg);
  return (
    "#" +
    ColorToHex(parseInt(match[1])) +
    ColorToHex(parseInt(match[2])) +
    ColorToHex(parseInt(match[3]))
  );
}

const app = Vue.createApp({
  data() {
    return {
      taiwanCountry: [],
      countyRevenue: [],
    };
  },
  methods: {
    init() {
      axios.get(county_geomap_api).then((res) => {
        axios.get(county_revenue_api).then((res2) => {
          this.draw_map(res.data, res2.data[0].data);
        });
      });
    },
    draw_map(mapData, countyRevenue) {
      let projection = d3.geoMercator().center([123, 24]).scale(5500);
      let path = d3.geoPath(projection);

      //  Color Scale
      const colorScale = d3
        .scaleLinear()
        .domain([0, countyRevenue.length])
        .range([
          "#ec595c", // <= lower bound of our color scale
          "#bcafb0", // <= upper bound of our color scale
        ]);

      d3.select("g.counties")
        .selectAll("path")
        .data(
          topojson.feature(mapData, mapData.objects["COUNTY_MOI_1090820"])
            .features
        )
        .enter()
        .append("path")
        .on("mouseover", function (e) {
          let str;
          const newData = countyRevenue.find(
            (item) => item.city === e.target.__data__.properties.COUNTYNAME
          );
          str = newData
            ? `${newData.city}, ${newData.revenue}`
            : e.target.__data__.properties.COUNTYNAME;
          console.log(typeof str);
          d3.select("g.counties")
            .append("text")
            .attr("fill", "#f3dc71")
            .attr("x", `${(900 / 3) * 2}`)
            .attr("y", `${600 / 2}`)
            .attr("id", "super")
            .text(str)
            .style("font-size", "32px");
        })
        .on("mouseleave", function () {
          d3.select("#super").remove();
        })
        .attr("d", path)
        .attr("fill", (d) => {
          const cityObj = countyRevenue.find(
            (item) => item.city === d.properties.COUNTYNAME
          );
          let color;
          if (cityObj) {
            color = ConvertRGBtoHex(colorScale(cityObj.rank));
          }
          return color || "#d6d6d6";
        });

      d3.select("path.county-borders").attr(
        "d",
        path(
          topojson.mesh(
            mapData,
            mapData.objects["COUNTY_MOI_1090820"],
            function (a, b) {
              return a !== b;
            }
          )
        )
      );
    },
  },
  mounted() {
    this.init();
  },
}).mount("#app");
