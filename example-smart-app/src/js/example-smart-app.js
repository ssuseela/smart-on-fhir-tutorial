(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', //height
                              //'http://loinc.org|8462-4', //Diastolic blood pressure
                              //'http://loinc.org|8480-6', //systolic blood pressure
                              // 'http://loinc.org|85354-9', //Diastolic and systolic blood pressure
                              'http://loinc.org|2085-9', //measurement of cholesterol in high-density lipoprotein (HDL) in serum or plasma
                              'http://loinc.org|2089-1', //Cholesterol in LDL Mass/volume in Serum or Plasma.
                              //'http://loinc.org|55284-4', //blood pressure systolic and diastolic
                              'http://loinc.org|85354-9', //blood pressure systolic and diastolic
                              'http://loinc.org|8310-5' //temperature
                             ]
                      }
                    }
                  });

          var allergy = smart.patient.api.fetchAll({
                    type: 'AllergyIntolerance',
                    query: {
                        "clinical-status":"active"
                    }
                  });

        $.when(pt, obv, allergy).fail(onError);

        $.when(pt, obv, allergy).done(function(patient, obv, allg) {
          console.log(patient);
          console.log(obv);
          console.log(allg);

          //alert(allg[0].text);

          const toAlert = [];
          allg.forEach(($v) => { 
            toAlert.push($v.code.text); 
          });

          //alert("Allergies:\r\n" + toAlert.join("\r\n");

          
          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;

          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family;
          }

          var height = byCodes('8302-2');
          //var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          //var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var systolicbp = getBloodPressureValue(byCodes('85354-9'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('85354-9'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');
          var tp = byCodes('8310-5');

          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);
          p.allergy = "<div>" + toAlert.join("</div><div>") + "</div>";

          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);
          p.tp = getQuantityValueAndUnit(tp[0]);

          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
      tp: {value: ''},
      allergy: {value: ''},
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
    $('#tp').html(p.tp);
    $('#allergy').html(p.allergy);
  };

})(window);
