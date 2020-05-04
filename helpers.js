
module.exports = {
    updateObjectWithCalculations : function(object, coef){
  
      let updateObject = {}
      Object.keys(object).map(objectKey =>{
        let scaled = object[`${objectKey}`]*coef
        updateObject[`${objectKey}_SCALED`] = scaled;
        updateObject[`${objectKey}_CANVAS`] = object[`${objectKey}`]*coef
     })

     return {...object, ...updateObject}
    },

    transformToXY : function(obj,view){

      //DEFAULT VIEW IS SIDELINE, THEREFORE LENGTH IS X, WIDTH IS Y
      let X = obj.X;
      let Y= obj.Y;
      
      if(view=='endzone')
      {
        const temp = X;
        X = Y;
        Y = temp;
        
      }
     
      return {X,Y}
      },


      swapAndScaleBoundaries : function(dimensions, view, scale, zoomIn){
        const {FIELD_LENGTH, FIELD_WIDTH, LEFT_HASH, RIGHT_HASH} = dimensions
        //DEFAULT VIEW IS SIDELINE, THEREFORE LENGTH IS X, WIDTH IS Y
        let X = FIELD_LENGTH;
        let Y= FIELD_WIDTH;
        let LEFT_HASH_PX, RIGHT_HASH_PX, SCALED_YARD;

        if(view=='end zone')
        {
          console.log('SWAP')
          const temp = X;
          X = Y;
          Y = temp;
          
        }

       let FIELD_WIDTH_PX = X*scale;

       let FIELD_HEIGHT_PX = Y*scale;

      

      SCALED_YARD = LEFT_HASH_PX = RIGHT_HASH_PX = 0
console.log(`original hashes: left: ${LEFT_HASH} right: ${RIGHT_HASH}`)


       switch(view){
        case "west":
          LEFT_HASH_PX = LEFT_HASH*scale;
          RIGHT_HASH_PX = RIGHT_HASH*scale
          SCALED_YARD = scale;
      break;

       case  "east" :
            LEFT_HASH_PX = LEFT_HASH*scale;
            RIGHT_HASH_PX = RIGHT_HASH*scale
            SCALED_YARD = scale;
        break;
      
        case "end zone" : 
        LEFT_HASH_PX = LEFT_HASH*scale;
        RIGHT_HASH_PX = RIGHT_HASH*scale
        SCALED_YARD = scale
        break;
      
        default:
      
       }  

       
        return {FIELD_WIDTH_PX, FIELD_HEIGHT_PX, LEFT_HASH_PX, RIGHT_HASH_PX, SCALED_YARD, FIELD_LENGTH, FIELD_WIDTH}
        }
}


