function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
// =======================
// 全局提示
// =======================

async function logoutAdmin(){
    await fetch("/api/auth/logout", { method:"POST" });
    window.location.replace("/login.html");
}

async function ensureAdminLogin(){
    const response = await fetch("/api/auth/status");
    const data = await response.json();
    if(!data.loggedIn){
        window.location.replace("/login.html");
        return false;
    }
    if(data.role !== "admin"){
        window.location.replace("/index.html");
        return false;
    }
    return true;
}


function showMessage(text, type="success"){


    const message =
    document.getElementById("message");


    message.textContent=text;


    message.style.display="block";


    if(type==="error"){

        message.style.background="#dc3545";

    }
    else{

        message.style.background="#2c7be5";

    }



    setTimeout(()=>{

        message.style.display="none";


    },2000);


}

// =======================
// 产品规格管理
// =======================


async function loadSpecs(){


    try{


        const response =
            await fetch("/api/specs/all");


        if(!response.ok){

            throw new Error("加载规格失败");

        }


        const data =
            await response.json();


        window.specData = data;


        renderSpecs(data);


    }catch(err){

        console.error(err);

        showMessage("规格数据加载失败");

    }


}





function renderSpecs(data){


    const tbody =
        document.querySelector(
            "#specTable tbody"
        );


    tbody.innerHTML="";



    data.forEach(item=>{


        const tr =
            document.createElement("tr");



        tr.innerHTML = `


        <td>${item.id}</td>


        <td>
        <input value="${escapeHtml(item.spec)}" id="spec-${item.id}">
        </td>


        <td>
        <input value="${item.width}" id="width-${item.id}">
        </td>


        <td>
        <input value="${item.length}" id="length-${item.id}">
        </td>


        <td>
        <input value="${item.pieces}" id="pieces-${item.id}">
        </td>



        <td>
        <input type="number"
        step="0.01"
        value="${item.base_cost}"
        id="base-${item.id}">
        </td>


        <td>
        <input type="number"
        step="0.01"
        value="${item.glue_cost}"
        id="glue-${item.id}">
        </td>


        <td>
        <input type="number"
        step="0.01"
        value="${item.label_cost}"
        id="label-${item.id}">
        </td>


        <td>
        <input type="number"
        step="0.01"
        value="${item.box_cost}"
        id="box-${item.id}">
        </td>



        <td>
        <input type="number"
        step="0.01"
        value="${item.labor_cost}"
        id="labor-${item.id}">
        </td>


        <td>
        <input type="number"
        step="0.01"
        value="${item.management_cost}"
        id="manage-${item.id}">
        </td>


        <td>
        <input type="number"
        step="0.01"
        value="${item.shipping_cost}"
        id="ship-${item.id}">
        </td>



        <td>

        <button onclick="updateSpec(${item.id})">
        保存
        </button>


        <button onclick="deleteSpec(${item.id})">
        删除
        </button>


        </td>


        `;



        tbody.appendChild(tr);



    });



}





async function updateSpec(id){



    const body = {


        spec:
        document.getElementById(`spec-${id}`).value.trim(),


        width:
        Number(document.getElementById(`width-${id}`).value),


        length:
        Number(document.getElementById(`length-${id}`).value),


        pieces:
        Number(document.getElementById(`pieces-${id}`).value),



        base_cost:
        Number(document.getElementById(`base-${id}`).value),


        glue_cost:
        Number(document.getElementById(`glue-${id}`).value),


        label_cost:
        Number(document.getElementById(`label-${id}`).value),


        box_cost:
        Number(document.getElementById(`box-${id}`).value),


        labor_cost:
        Number(document.getElementById(`labor-${id}`).value),


        management_cost:
        Number(document.getElementById(`manage-${id}`).value),


        shipping_cost:
        Number(document.getElementById(`ship-${id}`).value)


    };




    if(!body.spec){

        showMessage("规格不能为空");

        return;

    }




    try{


        const response =
        await fetch(
            `/api/specs/${id}`,
            {

                method:"PUT",

                headers:{
                    "Content-Type":"application/json"
                },


                body:
                JSON.stringify(body)

            }
        );



        if(!response.ok){

            throw new Error();

        }



        showMessage("保存成功");


        const index = window.specData.findIndex(item => item.id === id);

        if(index !== -1){

            window.specData[index] = {
                ...window.specData[index],
                ...body
            };

        }


        searchSpecs();



    }catch(err){


        console.error(err);

        showMessage("保存失败");


    }


}





async function deleteSpec(id){



    if(
        !confirm("确定删除该规格吗？")
    ){

        return;

    }



    try{


        const response =
        await fetch(
            `/api/specs/${id}`,
            {
                method:"DELETE"
            }
        );



        if(!response.ok){

            throw new Error();

        }



        loadSpecs();



    }catch(err){


        console.error(err);

        showMessage("删除失败");


    }


}

// =======================
// 砂布价格管理
// =======================


async function loadSandpaper(){


    try{


        const response =
            await fetch(
                "/api/sandpaper/all"
            );


        if(!response.ok){

            throw new Error("加载砂布数据失败");

        }



        const data =
            await response.json();



        window.sandpaperData = data;


        renderSandpaper(data);



    }catch(err){


        console.error(err);

        showMessage("砂布数据加载失败");


    }


}




function renderSandpaper(data){


    const tbody =
        document.querySelector(
            "#sandpaperTable tbody"
        );



    tbody.innerHTML="";



    data.forEach(item=>{


        const tr =
            document.createElement("tr");



        tr.innerHTML = `


        <td>${item.id}</td>


        <td>
        <input
        value="${escapeHtml(item.abrasive)}"
        id="abrasive-${item.id}">
        </td>



        <td>
        <input
        value="${escapeHtml(item.material_no)}"
        id="material-${item.id}">
        </td>



        <td>
        <input
        value="${escapeHtml(item.grit)}"
        id="grit-${item.id}">
        </td>



        <td>

        <input
        type="number"
        step="0.01"
        value="${item.price}"
        id="price-${item.id}">

        </td>



        <td>


        <button onclick="updateSandpaper(${item.id})">
        保存
        </button>


        <button onclick="deleteSandpaper(${item.id})">
        删除
        </button>


        </td>


        `;



        tbody.appendChild(tr);



    });



}







async function updateSandpaper(id){



    const body = {


        abrasive:
        document.getElementById(
            `abrasive-${id}`
        ).value.trim(),



        material_no:
        document.getElementById(
            `material-${id}`
        ).value.trim(),



        grit:
        document.getElementById(
            `grit-${id}`
        ).value.trim(),



        price:
        Number(
            document.getElementById(
                `price-${id}`
            ).value
        )


    };




    if(
        !body.abrasive ||
        !body.material_no ||
        !body.grit ||
        isNaN(body.price)
    ){

        showMessage("请输入完整砂布信息");

        return;

    }





    try{


        const response =
        await fetch(

            `/api/sandpaper/${id}`,

            {

                method:"PUT",

                headers:{
                    "Content-Type":"application/json"
                },


                body:
                JSON.stringify(body)

            }

        );



        if(!response.ok){

            throw new Error();

        }



        showMessage("保存成功");


        const index = window.sandpaperData.findIndex(item => item.id === id);

        if(index !== -1){

            window.sandpaperData[index] = {
                ...window.sandpaperData[index],
                ...body
            };

        }


        searchSandpaper();



    }catch(err){


        console.error(err);

        showMessage("保存失败");


    }



}






async function deleteSandpaper(id){



    if(
        !confirm("确定删除该砂布价格吗？")
    ){

        return;

    }



    try{


        const response =
        await fetch(

            `/api/sandpaper/${id}`,

            {

                method:"DELETE"

            }

        );



        if(!response.ok){

            throw new Error();

        }



        loadSandpaper();



    }catch(err){


        console.error(err);

        showMessage("删除失败");


    }


}









// =======================
// 添加产品规格
// =======================


async function addSpec(){



    const body = {


        spec:
        prompt("请输入规格，例如 8寸-200"),


        width:
        Number(prompt("条宽")),


        length:
        Number(prompt("页长")),


        pieces:
        Number(prompt("页数")),


        base_cost:
        Number(prompt("基体成本")),


        glue_cost:
        Number(prompt("胶水成本")),


        label_cost:
        Number(prompt("标贴成本")),


        box_cost:
        Number(prompt("纸箱成本")),


        labor_cost:
        Number(prompt("人工成本")),


        management_cost:
        Number(prompt("管理成本")),


        shipping_cost:
        Number(prompt("运费"))


    };





    if(!body.spec){


        showMessage("规格不能为空");

        return;


    }





    try{


        const response =
        await fetch(

            "/api/specs",

            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },


                body:
                JSON.stringify(body)

            }

        );



        if(!response.ok){

            throw new Error();

        }



        showMessage("添加成功");


        loadSpecs();



    }catch(err){


        console.error(err);

        showMessage("添加失败");


    }



}









// =======================
// 添加砂布
// =======================


async function addSandpaper(){



    const body = {


        abrasive:
        prompt("请输入磨料"),



        material_no:
        prompt("请输入砂布编号"),



        grit:
        prompt("请输入粒度"),



        price:
        Number(
            prompt("请输入价格")
        )


    };





    if(

        !body.abrasive ||
        !body.material_no ||
        !body.grit ||
        isNaN(body.price)

    ){

        showMessage("请输入完整信息");

        return;

    }





    try{


        const response =
        await fetch(

            "/api/sandpaper",

            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },


                body:
                JSON.stringify(body)

            }

        );



        if(!response.ok){

            throw new Error();

        }



        showMessage("添加成功");


        loadSandpaper();



    }catch(err){


        console.error(err);

        showMessage("添加失败");


    }



}









// =======================
// 页面切换
// =======================


function showSpecs(){


     document.getElementById(
            "specSection"
        ).style.display="block";


        document.getElementById(
            "sandpaperSection"
        ).style.display="none";


        document.getElementById(
            "quotationSection"
        ).style.display="none";


}






function showSandpaper(){


    document.getElementById(
            "specSection"
        ).style.display="none";


        document.getElementById(
            "sandpaperSection"
        ).style.display="block";


        document.getElementById(
            "quotationSection"
        ).style.display="none";



}


function showQuotations(){


    document.getElementById(
        "specSection"
    ).style.display="none";


    document.getElementById(
        "sandpaperSection"
    ).style.display="none";


    document.getElementById(
        "quotationSection"
    ).style.display="block";


    loadQuotations();


}




// =======================
// 搜索
// =======================


function searchSpecs(){



    if(!window.specData){

        return;

    }



    const keyword =
    document.getElementById(
        "specSearch"
    ).value.trim().toLowerCase();



    const filtered =
    window.specData.filter(item=>{


        return String(item.spec)
        .toLowerCase()
        .includes(keyword);


    });



    renderSpecs(filtered);



}








function searchSandpaper(){



    if(!window.sandpaperData){

        return;

    }



    const keyword =
    document.getElementById(
        "sandpaperSearch"
    ).value.trim().toLowerCase();



    const filtered =
    window.sandpaperData.filter(item=>{


        return (

            String(item.abrasive).toLowerCase().includes(keyword)

            ||

            String(item.material_no).toLowerCase().includes(keyword)

            ||

            String(item.grit).toLowerCase().includes(keyword)

        );


    });



    renderSandpaper(filtered);



}

// =======================
// 报价记录
// =======================


function loadQuotations(){


    fetch("/api/quotations")

    .then(res=>res.json())

    .then(data=>{


        let table =
            document.getElementById(
                "quotationTable"
            );


        table.innerHTML="";



        data.forEach(item=>{


            let tr =
            document.createElement("tr");



            tr.innerHTML = `

            <td>${item.id}</td>

            <td>${escapeHtml(item.remark)}</td>

            <td>
            ${item.width}×${item.length}×${item.pages}
            </td>

            <td>
            ${escapeHtml(item.abrasive)}
            </td>

            <td>
            ${Number(item.sandpaper_cost).toFixed(5)}
            </td>


            <td>
            ${Number(item.total_cost_tax_shipping).toFixed(5)}
            </td>


            <td>

            中间商：

            ${item.profit_rate}%

            <br>

            利润：

            ${Number(item.profit).toFixed(5)}

            <br>

            售价：

            ${Number(item.sale_price).toFixed(2)}

            <br>

            不开票：

            ${Number(item.no_invoice).toFixed(2)}

            </td>



            <td>

            终端用户：

            ${item.profit_rate_2}%

            <br>

            利润：

            ${Number(item.profit_2).toFixed(5)}

            <br>

            售价：

            ${Number(item.sale_price_2).toFixed(2)}

            <br>

            不开票：

            ${Number(item.no_invoice_2).toFixed(2)}

            </td>


            <td>
            ${item.created_at}
            </td>


            <td>

            <button
            onclick="deleteQuotation(${item.id})">
            删除
            </button>

            </td>

            `;



            table.appendChild(tr);


        });


    });


}





function deleteQuotation(id){


    if(!confirm("确定删除该报价记录吗？")){

        return;

    }



    fetch(
        `/api/quotations/${id}`,
        {

            method:"DELETE"

        }
    )

    .then(res=>res.json())

    .then(()=>{

        loadQuotations();

    });


}




// =======================
// 页面初始化
// =======================


ensureAdminLogin().then(loggedIn => {
    if(!loggedIn) return;
    loadSpecs();
    loadSandpaper();
    showSpecs();
    loadQuotations();
});
