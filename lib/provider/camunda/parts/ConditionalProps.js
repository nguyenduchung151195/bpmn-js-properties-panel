'use strict';
var is = require('bpmn-js/lib/util/ModelUtil').is,
    isAny = require('bpmn-js/lib/features/modeling/util/ModelingUtil').isAny,
    getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject,
    escapeHTML = require('../../../Utils').escapeHTML,
    domQuery = require('min-dom').query,
    cmdHelper = require('../../../helper/CmdHelper'),
    elementHelper = require('../../../helper/ElementHelper'),
    eventDefinitionHelper = require('../../../helper/EventDefinitionHelper'),
  scriptImplementation = require('./implementation/Script'),
    
  properties = require('./implementation/Properties'),
    elementHelper = require('../../../helper/ElementHelper'),
    cmdHelper = require('../../../helper/CmdHelper');

module.exports = function(group, element, bpmnFactory, translate) {
  var bo = getBusinessObject(element);

  if (!bo) {
    return;
  }
  var a = false;

  var conditionalEventDefinition = eventDefinitionHelper.getConditionalEventDefinition(element);

  if (!(is(element, 'bpmn:SequenceFlow') && isConditionalSource(element.source))
    && !conditionalEventDefinition) {
    return;
  }
  
  var script = scriptImplementation('language', 'body', true, translate);
  group.entries.push({
    id: 'condition',
    label: translate('Condition'),
    html: '<div class="bpp-row">' +
              '<label for="cam-condition-type">'+ escapeHTML(translate('Condition Type')) + '</label>' +
              '<div class="bpp-field-wrapper">' +
                '<select id="cam-condition-type" name="conditionType" data-value>' +
                  '<option value="expression" class="o_exp1">'+ escapeHTML(translate('Expression')) + '</option>' +
                  '<option value="script">' + escapeHTML(translate('Script')) + '</option>' +
                  '<option value="" selected></option>' +
                '</select>' +
              '</div>' +
            '</div>' +

            // expression
            '<div class="bpp-row">' +
              '<label for="cam-condition" data-show="isExpression" >' + escapeHTML(translate('Logic')) + '</label>' +
              '<div class="bpp-field-wrapper" data-show="isExpression">' +
              '<select  >' +
              '<option value="">'+ escapeHTML(translate('And')) + '</option>' +
              '<option value="" selected>' + escapeHTML(translate('Or')) + '</option>' +
              '<option value="" ></option>' +
            '</select>' +
              '</div>' +
              '<div data-show="isScript">' +
                script.template +
              '</div>' +
            '</div>',

    get: function(element, propertyName) {
      var conditionalEventDefinition = eventDefinitionHelper.getConditionalEventDefinition(element);

      var conditionExpression = conditionalEventDefinition
        ? conditionalEventDefinition.condition
        : bo.conditionExpression;

      var values = {},
          conditionType = '';

      if (conditionExpression) {
        var conditionLanguage = conditionExpression.language;
        if (typeof conditionLanguage !== 'undefined') {
          conditionType = 'script';
          values = script.get(element, conditionExpression);
        } else {
          conditionType = 'expression';
          values.condition = conditionExpression.get('body');
          
        }
      }

      values.conditionType = conditionType;

      return values;

    },

    set: function(element, values, containerElement) {
      var conditionType = values.conditionType;
      var commands = [];

      var conditionProps = {
        body: undefined
      };

      if (conditionType === 'script') {
        conditionProps = script.set(element, values, containerElement);

      }
      else {
        var condition = values.condition;
        conditionProps.body = condition;
      }

      var conditionOrConditionExpression;

      if (conditionType) {
        conditionOrConditionExpression = elementHelper.createElement(
          'bpmn:FormalExpression',
          conditionProps,
          conditionalEventDefinition || bo,
          bpmnFactory
        );

        var source = element.source;

        // if default-flow, remove default-property from source
        if (source && source.businessObject.default === bo) {
          commands.push(cmdHelper.updateProperties(source, { 'default': undefined }));
        }
      }

      var update = conditionalEventDefinition
        ? { condition: conditionOrConditionExpression }
        : { conditionExpression: conditionOrConditionExpression };

      commands.push(cmdHelper.updateBusinessObject(element, conditionalEventDefinition || bo, update));

      return commands;
    },

    validate: function(element, values) {
      var validationResult = {};

      if (!values.condition && values.conditionType === 'expression') {
        validationResult.condition = translate('Must provide a value');
      }
      else if (values.conditionType === 'script') {
        validationResult = script.validate(element, values);
      }

      return validationResult;
    },

    isExpression: function(element, inputNode) {
      var conditionType = domQuery('select[name=conditionType]', inputNode);
      if (conditionType.selectedIndex >= 0) {
        return conditionType.options[conditionType.selectedIndex].value === 'expression';

      }
    },

    isScript: function(element, inputNode) {
      var conditionType = domQuery('select[name=conditionType]', inputNode);
      if (conditionType.selectedIndex >= 0) {
        return conditionType.options[conditionType.selectedIndex].value === 'script';
      }
    },

    clear: function(element, inputNode) {

      // clear text input
      domQuery('input[name=condition]', inputNode).value='';

      return true;
    },

    canClear: function(element, inputNode) {
      var input = domQuery('input[name=condition]', inputNode);

      return input.value !== '';
    },

    script : script,

    cssClasses: [ 'bpp-textfield' ]
  });
  var propertiesEntry = properties(element, bpmnFactory, {
    id: 'properties',
    modelProperties: [ 'name','value' ],
    labels: [ translate('field'), translate('Value')  ],
    // modelProperties: [ 'field', 'operator','value' ],
    // labels: [ translate('field'), translate('operator'), translate('value')  ],

    getParent: function(element, node, bo) {
      return bo.extensionElements;
    },

    createParent: function(element, bo) {
      var parent = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
      var cmd = cmdHelper.updateBusinessObject(element, bo, { extensionElements: parent });
      console.log(cmd);
      return {
        cmd: cmd,
        parent: parent
      };
    }
  }, translate);
    if (propertiesEntry) {
      group.entries.push(propertiesEntry);  
    }
  if (document.getElementById('cam-condition-type')) {

   
    if (document.getElementById('cam-condition-type').value === 'expression') {
      const hidden = document.querySelector('.bpp-table-add-row');
      const bppTable = document.querySelector('.bpp-table');
      hidden.classList.remove('c__hide');
      if (bppTable) {
        bppTable.classList.remove('c__hide');
      }
    }
    else {
      const hidden = document.querySelector('.bpp-table-add-row');
      hidden.classList.add('c__hide');
      const bppTable = document.querySelector('.bpp-table');
      if (bppTable) {
        bppTable.classList.add('c__hide');
      }
    }
  }
 
};


// utilities //////////////////////////

var CONDITIONAL_SOURCES = [
  'bpmn:Activity',
  'bpmn:ExclusiveGateway',
  'bpmn:InclusiveGateway',
  'bpmn:ComplexGateway'
];

function isConditionalSource(element) {
  return isAny(element, CONDITIONAL_SOURCES);
}
