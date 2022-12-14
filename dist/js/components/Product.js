import {select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product {
  constructor(id, data) {
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();

    //console.log('new Product:', thisProduct);
  }

  renderInMenu() {
    const thisProduct = this;

    /* [DONE] generate HTML based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);
    //console.log(generateHTML);

    /* [DONE] create element using utils.createElementFromHTML */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);

    /* [DONE] find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);

    /* [DONE] add element to menu */
    menuContainer.appendChild(thisProduct.element);

  }

  getElements() {
    const thisProduct = this;

    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    //console.log(thisProduct.accordionTrigger);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    //console.log(thisProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAccordion() {
    const thisProduct = this;
    /* [DONE] find the clickable trigger (the element that should react to clicking) */
    //const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    //console.log('clickableTrigger', clickableTrigger);

    /* [DONE] START: add event listener to clickable trigger on event click */
    thisProduct.accordionTrigger.addEventListener('click', function(event) {

      /* [DONE] prevent default action for event */
      event.preventDefault();

      /* [DONE] find active product (product that has active class) */
      const activeProduct = document.querySelector(select.all.menuProductsActive);
      //console.log('Active class:', activeProduct);

      /* [DONE] if there is active product and it's not thisProduct.element, remove class active from it */
      if (activeProduct != null && activeProduct != thisProduct.element) {
        activeProduct.classList.remove('active');
      }

      /* [DONE] toggle active class on thisProduct.element */
      thisProduct.element.classList.toggle('active');
    
    });
  }

  initOrderForm() {
    const thisProduct = this;
    //console.log(' -- initOrderForm -- ');
    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });
    
    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }
    
    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  processOrder() {
    const thisProduct = this;
    //console.log(' -- processOrder -- ');

    // [DONE] covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.form);
    //console.log('formData', formData);
    
    // [DONE] set price to default price
    let price = thisProduct.data.price;

    // [DONE] for every category (param)...
    for(let paramId in thisProduct.data.params) {
    
      // [DONE] determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];
      //console.log(paramId, param);

      // [DONE] for every option in this category
      for(let optionId in param.options) {
        
        // [DONE] determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];
        //console.log(optionId, option);

        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);        

        // [DONE] check if there is param with a name of paramId in formData and if it includes optionId
        if(optionSelected) {

          // [DONE] check if the option is not default
          if(!option.default == true) {

            // [DONE] add option price to price variable
            price += option.price;

          }
        } else {

          // [DONE] check if the option is default
          if(option.default == true) {

            // [DONE] reduce price variable
            price -= option.price;
            
          }
        }

        const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
        //console.log(optionImage);

        if(optionImage) {
          if (optionSelected) {
            // [DONE] Yes! We've found it!
            optionImage.classList.add(classNames.menuProduct.imageVisible);

          } else {

            optionImage.classList.remove(classNames.menuProduct.imageVisible);
        
          }
        }
      }
    }

    thisProduct.priceSingle = price;
    //console.log(thisProduct.priceSingle);

    /* [DONE] multiply price by amount */
    price *= thisProduct.amountWidget.value;
    //console.log(price);
        
    // [DONE] update calculated price in the HTML
    thisProduct.priceElem.innerHTML = price;
  }

  addToCart() {
    const thisProduct = this;

    //app.cart.add(thisProduct.prepareCartProduct());

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });

    thisProduct.element.dispatchEvent(event);
  }

  prepareCartProduct() {
    const thisProduct = this;

    const productSummary = {
      id: thisProduct.id,
      name: thisProduct.data.name,
      amount: thisProduct.amountWidget.value,
      priceSingle: thisProduct.priceSingle,
      price: thisProduct.priceSingle * thisProduct.amountWidget.value,
      params: thisProduct.prepareCartProductParams(),
    };

    return productSummary;
  }

  prepareCartProductParams() {
    const thisProduct = this;

    const formData = utils.serializeFormToObject(thisProduct.form);
    const params = {};

    // [DONE] for every category (param)...
    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];

      // [DONE] create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
      params[paramId] = {
        label: param.label,
        options: {}
      };

      // [DONE] for every option in this category
      for(let optionId in param.options) {
        const option = param.options[optionId];
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);        

        if(optionSelected) {
        // [DONE] option is selected!
          params[paramId].options[optionId] = option.label;
        }
      }
    }

    return params;
  }


  initAmountWidget() {
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('updated', function() {
      thisProduct.processOrder();
    });

  }
}

export default Product;