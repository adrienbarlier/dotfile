import Tracker from "../../js/tracker"
import { config } from "../../js/common/config"
var __$ = require("jquery")

class DefaultPage {

    static initBackgroundConnection() {
        let _this = this;
        _this.port = chrome.runtime.connect({ name: config.messageChannelName });
        _this.port.onMessage.addListener((msg) => { _this.onMessageRecive(msg); });
    }

    static render() {
        this.init()
        this.initBackgroundConnection()
    }

    static getDateArray() {
        let result = []
        let seed = 14
        while (seed > 0) {
            result.push(Date.parse("t -" + seed).toString("yyyy-MM-dd"))
            seed--
        }
        return result
    }

    static init() {
        let _this = this
        Tracker.getAllTrackerProducts().then(data => {
            let keys = Object.keys(data)
            let items = []
            keys.forEach(element => {
                items.push(data[element].data)
            });

            _this.createProductDataTable(items)
            _this.renderChart(items)
        })

        __$("#bt_refresh").click(function(){Tracker.refreshProductTrackerList().then(result => {
            if (!result) {
                alert("refresh error,please login aliexpress account!")
            }
        })})
    }

    static onMessageRecive(msg) {}

    static createProductDataTable(data) {
        let _this = this
        let datas = []
        let days = this.getDateArray()
        let colums = [
            { title: "Subject" },
            { title: "LR" },//LogisticsReliability
            { title: "SDS" },// SellerDsSupplier
            { title: "Image" },
            { title: "Store" }
        ]

        if (data.length > 0) {
            data.forEach(element => {
                let cols = [
                    "<a href='https:" + element.url + "' target='_blank'> " + element.subject + "</a>",
                    element.logisticsReliability,
                    element.SellerDsSupplier ? "Y" : "N",
                    "<img style='width:50px' src='" + element.imageUrl + "' />",
                    "<a href='https:" + element.storeUrl + "' target='_blank'> " + element.storeName + "</a>"]

                let pre = -1
                let goodCount = 0
                //let index = 0
                days.forEach(day => {
                    //if (index > 7) {
                        let sales = element.saleVolume[day] ? element.saleVolume[day] : -1
                        let isGood = "N"

                        if (pre < 0) {
                            pre = sales
                        } else if (_this.judeIsHotData(pre, sales)) {
                            isGood = "Y"
                            goodCount++
                        }

                        cols.push(sales)
                        cols.push("<font color=" + (isGood == "Y" ? "red" : "green") + ">" + isGood + "</font>")
                        pre = sales
                    // }
                    // index++
                })
                cols.unshift("<a href='javascript:;' id='bt_remove' pid='" + element.id + "'>remove</a>--<a href='javascript:;' id='bt_add' pid='" + element.id + "'>add</a>")
                cols.unshift(goodCount)
            
                datas.push(cols)
            })

            //let index = 0
            days.forEach(day => {
                //if (index > 7) {
                    colums.push({
                        title: day.split('-').slice(2,3).toString()
                    })
                    colums.push({
                        title: ""
                    })
                // }
                // index++
            })

            colums.unshift({ title: "Edit" })
            colums.unshift({ title: "Count" })
           
        }

        __$(document).ready(function () {
            var table = __$('#products_table').DataTable({
                data: datas,
                columns: colums,
                order:[0,"DESC"]
            })

            __$('#products_table tbody').on('click', 'a#bt_remove', function () {
                console.log(__$(this).attr("pid"))
                Tracker.removeProductFromTracker(__$(this).attr("pid"), function () {
                    table.reload()
                })
            })

            __$('#products_table tbody').on('click', 'a#bt_add', function () {
                //console.log(__$(this).attr("pid"))
                _this.syncProductToDsers(__$(this).attr("pid"))
            })

        })
    }

    static syncProductToDsers(productid) {
        this.port.postMessage({
            type: "DSERS_SYNC_PRODUCT_TO_SHOP",
            data: {
                id: productid
            }
        });
    }

    static idHotProduct(days, volums) {
        let pre = -1
        let goodCount = 0

        days.forEach(day => {
            let sales = volums[day] ? volums[day] : -1
            if (pre < 0) {
                pre = sales
            } else if (this.judeIsHotData(pre, sales)) {
                goodCount++
            }
        })

        return goodCount > 0
    }

    static judeIsHotData(pre, sales) {
        if (pre < 10 && sales > 30) {
            return true
        } else if (pre >= 10 && pre <= 30 && sales >= 50) {
            return true
        } else if (pre > 30 && sales >= pre * 2) {
            return true
        } else {
            return false
        }
    }

    static removeFromTracker(productid) {
        console.log(productid)
    }

    // static syncToDser(productid) {
    //     this.syncProduct(productid)
    // }

    static renderChart(data) {
       let xAxis = [];
        let legendData = [];
        let seriesData = [];

        if (data.length > 0) {
            xAxis = this.getDateArray()
        }

        data.forEach(element => {
            if (this.idHotProduct(xAxis, element.saleVolume)) {
                let values = []
                Object.values(element.saleVolume)
                xAxis.forEach(day => {
                    values.push({
                        x: new Date(day),
                        y: element.saleVolume[day] ? element.saleVolume[day] : 0
                    })
                })

                legendData.push(element.subject)
                seriesData.push({
                    type: "line",
                    showInLegend: true,
                    name: element.subject.substr(0,30),
                    markerType: "square",
                    xValueFormatString: "DD MMM, YYYY",
                    //color: "#F08080",
                    yValueFormatString: "#,##0",
                    dataPoints:values
                })
            }
        })

		var options = {
            animationEnabled: true,
            theme: "light2",
            title:{
                text: ""
            },
            axisX:{
                valueFormatString: "DD MMM"
            },
            axisY: {
                title: "Number of Sales"
                //,
                //suffix: "K",
                //minimum: 30
            },
            toolTip:{
                shared:true
            },  
            legend:{
                cursor:"pointer",
                //verticalAlign: "top",
                horizontalAlign: "left",
                //dockInsidePlotArea: true,
                itemclick: toogleDataSeries
            },
            data: seriesData
        };
        console.log(options)
        __$(document).ready(function () {
            $("#product_chart").CanvasJSChart(options)
        })
    }

}

DefaultPage.render()
window.DefaultPage = DefaultPage


function toogleDataSeries(e){
	if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
		e.dataSeries.visible = false;
	} else{
		e.dataSeries.visible = true;
	}
	e.chart.render();
}