const cont = document.getElementsByClassName('container')[0];
const box = document.querySelector('.box')
const moon = document.getElementById('moon');
const sun = document.getElementById('sun');

let isDark = false;

function updateMode(){
    if(isDark){
    box.style.backgroundColor = 'cyan';
    box.style.boxShadow ='1px 2px 15px 0px white';
   
    }else if(!isDark){
     box.style.backgroundColor = 'pink';
     box.style.boxShadow ='1px 2px 15px 0px black';
    
}
}

moon.addEventListener("click", function(){
  sun.style.display = "flex";
  moon.style.display = "none";
  cont.style.backgroundColor = 'black';
  box.style.transform = 'rotate(90deg) translateY(220px)';
  isDark = true;
  updateMode();

})

sun.addEventListener("click", function(){
    sun.style.display = 'none';
    moon.style.display = 'flex';
    cont.style.backgroundColor = 'white';
    box.style.transform = 'rotate(0deg) translateX(100px)';
    isDark = false; 
    updateMode();
})
