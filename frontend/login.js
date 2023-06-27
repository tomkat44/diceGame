
function loginCredentials(){

    var username = document.getElementById("username");
    var password = document.getElementById("password");
    alert(password);
    let res = fetch('http://localhost:8000/accounts/login/', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({'username':username, 'password':password})});
    document.getElementById('submitButton').click();
}
