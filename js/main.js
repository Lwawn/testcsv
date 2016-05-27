var Record = Backbone.Model.extend({
	defaults: {
		created_at: '0000-00-00',
		time: '00:00:00',
		summary_status: 'failed',
		duration: '0'
	}
});

var data;
var OperationalData = Backbone.Collection.extend({
	model:Record
});

var operationalData=new OperationalData;


$(function($){
	var router = Backbone.Router.extend({
		routes: {
		    "": "start", 
		    "!/": "start", 
		    "success": "success", 
		    "error": "error" 
		},

		start: function () {
		    //console.log('router is working');
		    $("#error").hide();
		   	$("#chartContainer").hide();
			$("#chart2Container").hide();
			$("#back").hide();
		    $("#parser").show();
		},

		success: function () {
			$("#error").hide();
			$("#parser").hide();
			$("#chartContainer").show();
			$("#chart2Container").show();
			$("#back").show();
		  MakeCharts();

		   // console.log("succes in file");
		},

		error: function () {
		    $("#error").show();
		   // console.log("error in file");
		}
	});

	var controller = new router();

	Backbone.history.start();  

    var AppView = Backbone.View.extend({

        el: $('body'),
        events:{
            'click button#submit-parse':'check',
            'click button#back' : 'back'
        },
        check:function(){
    		if ($('#parser').find("#csv-file").val() == "") 
        		controller.navigate("error", true);
    		else
        		controller.navigate("success", true);
        },
        back:function(){
        	controller.navigate("",true);
        }
  	});

    var app = new AppView();

    function CreateDataFor1(){
		var dateoftest=[];
		var data={"passed":[],"failed":[]};
		for(var i=0;i<operationalData.length;i++){
			dateoftest.push(operationalData.models[i].attributes["created_at"]);
		}
		dateoftest=_.uniq(dateoftest);
		for(var i=0;i<dateoftest.length;i++){
			var temp=operationalData.where({created_at: dateoftest[i]});
			var passed=0;
			var failed=0;
			for(var j=0;j<temp.length;j++){
				if(temp[j].escape('summary_status')==="passed"){
					passed++;
				}
				else if(temp[j].escape('summary_status')==="failed"){
					failed++;
				}
			}
			//console.log({y: passed,label:dateoftest[i]});
			data["passed"].push({y: passed,label: dateoftest[i]});
			data["failed"].push({y: failed,label: dateoftest[i]});
		}
		data["passed"].reverse();
		data["failed"].reverse();
		return data;
	}

	function RenderChart(){
  		var charts1=CreateDataFor1();
	    var chart = new CanvasJS.Chart("chartContainer",
	    {
	      title:{
	      text: "Passing and failing builds per day"
	      },
	        data: [
	      {
	        type: "stackedColumn",
	        legendText: "Passed",
			showInLegend: "true",
	        dataPoints: charts1["passed"]
	      },  {
	        type: "stackedColumn",
	        legendText: "Failed",
			showInLegend: "true",
	        dataPoints: charts1["failed"]
	      }
	      ]
	    });
	    chart.render();
	}

	function CreateDataFor2(){
		var houroftest=[];
		var data=[];
		for(var i=0;i<operationalData.length;i++){
			//temp=operationalData.models[i].attributes["time"].split(":");
			houroftest.push(operationalData.models[i].attributes["time"]);
		}
		houroftest=_.uniq(houroftest);
		houroftest.sort();
		for(var i=0;i<houroftest.length;i++){
			var temp=operationalData.where({time: houroftest[i]});
			var duration=0;
			//console.log(temp[0]);
			for(j=0;j<temp.length;j++){
				duration+=parseInt(temp[j].escape('duration'));
			}
			duration=duration/temp.length;
			var time=new Date();
			time.setHours(houroftest[i],0);
			data.push({x: time , y: duration})
		}
		return data;
	}

	function RenderChart2(){
		 var chart = new CanvasJS.Chart("chart2Container",
	    {

	      title:{
	      text: "Build duration vs. Time"
	      },
	       data: [
	      {
	        type: "line",

	        dataPoints: CreateDataFor2()
	      }
	      ]
	    });

	    chart.render();
	}

 	function MakeCharts()
  	{
  		var file = document.getElementById("csv-file").files[0];
	    operationalData.reset();
	    operationalData=new OperationalData();
	    Papa.parse(file, {
	      header: true,
	      dynamicTyping: true,
	      complete: function(results) {
	        data = results;
	        for(var i=0; i<data.data.length; i++ ){
		    	
		    	var r1 = new Record({
					created_at: data.data[i].created_at.split(" ")[0],
					time: data.data[i].created_at.split(" ")[1].split(":")[0],
					summary_status: data.data[i].summary_status,
					duration: data.data[i].duration
				});
		    	operationalData.add(r1);
		    }
	      RenderChart();
	      RenderChart2();
	      }
	    })
  	}

});

