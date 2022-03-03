import {
  getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

import CreatePropertyHandler from './CreatePropertyHandler';
import CreateTaskDefinitionTypeHandler from './CreateTaskDefinitionTypeHandler';
import CreateInputHandler from './CreateInputHandler';
import CreateOutputHandler from './CreateOutputHandler';
import CreateTaskHeaderHandler from './CreateTaskHeaderHandler';

export default class TemplateElementFactory {

  constructor(bpmnFactory, elementFactory) {
    this._bpmnFactory = bpmnFactory;
    this._elementFactory = elementFactory;

    this._handlers = {
      'property': CreatePropertyHandler,
      'zeebe:taskDefinition:type': CreateTaskDefinitionTypeHandler,
      'zeebe:input': CreateInputHandler,
      'zeebe:output': CreateOutputHandler,
      'zeebe:taskHeader': CreateTaskHeaderHandler
    };
  }

  /**
   * Create an element based on an element template.
   *
   * @param {ElementTemplate} template
   * @returns {djs.model.Base}
   */
  create(template) {
    const {
      appliesTo,
      properties
    } = template;

    const elementFactory = this._elementFactory;
    const bpmnFactory = this._bpmnFactory;
    const handlers = this._handlers;

    // todo: throw?
    // todo: execute validation beforehand?
    if (!appliesTo || !appliesTo.length) {
      return;
    }

    // todo: what do if appliesTo has more than one entries?
    const type = appliesTo[0];

    // (1) create element from appliesTo
    const element = elementFactory.createShape({ type });

    // todo: do not do it if not needed (only properties)
    this._ensureExtensionElements(element);

    // (2) apply template
    this._setModelerTemplate(element, template);

    // (3) apply properties
    properties.forEach(function(property) {

      const {
        binding
      } = property;

      const {
        type: bindingType
      } = binding;

      const handler = handlers[bindingType];

      // todo: throw?
      if (!handler) {
        return;
      }

      handler.create(element, {
        property,
        bpmnFactory
      });
    });

    return element;
  }

  _ensureExtensionElements(element) {
    const bpmnFactory = this._bpmnFactory;
    const businessObject = getBusinessObject(element);

    let extensionElements = businessObject.get('extensionElements');

    if (!extensionElements) {
      extensionElements = bpmnFactory.create('bpmn:ExtensionElements', {
        values: []
      });

      extensionElements.$parent = businessObject;
      businessObject.set('extensionElements', extensionElements);
    }

    return extensionElements;
  }

  _setModelerTemplate(element, template) {
    const {
      id,
      version
    } = template;

    const businessObject = getBusinessObject(element);

    businessObject.set('zeebe:modelerTemplate', id);
    businessObject.set('zeebe:modelerTemplateVersion', version);
  }
}

TemplateElementFactory.$inject = [ 'bpmnFactory', 'elementFactory' ];