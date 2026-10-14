let currentQuotation = null;

fetch("/api/auth/status")
    .then(response => response.json())
    .then(data => {
        const isAdmin = data.loggedIn && data.role === "admin";
        document.getElementById("adminLink").hidden = !isAdmin;
        document.getElementById("quotationSaveArea").hidden = !isAdmin;
    });

async function logoutSystem() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/login.html");
}

function showToast(message){

    let toast = document.getElementById("toast");


    if(!toast){

        toast = document.createElement("div");

        toast.id = "toast";

        document.body.appendChild(toast);

    }


    toast.textContent = message;


    toast.classList.add("show");


    setTimeout(()=>{

        toast.classList.remove("show");

    },2000);

}

function calculate() {
    currentQuotation = null;


    // 获取输入参数

    let width = Number(document.getElementById("width").value);
    let length = Number(document.getElementById("length").value);
    let layers = Number(document.getElementById("layers").value);

    let gauzePrice = Number(document.getElementById("gauzePrice").value);

    let baseCost = Number(document.getElementById("baseCost").value);
    let glueCost = Number(document.getElementById("glueCost").value);
    let labelCost = Number(document.getElementById("labelCost").value);
    let cartonCost = Number(document.getElementById("cartonCost").value);

    let laborCost = Number(document.getElementById("laborCost").value);
    let managementCost = Number(document.getElementById("managementCost").value);
    let shippingCost = Number(document.getElementById("shippingCost").value);



    // 输入检查

    let values = [
        width,
        length,
        layers,
        gauzePrice,
        baseCost,
        glueCost,
        labelCost,
        cartonCost,
        laborCost,
        managementCost,
        shippingCost
    ];


    for (let value of values) {

        if (!Number.isFinite(value) || value < 0) {

            showToast("请输入完整成本数据");

            return;

        }

    }



    if (width <= 0 || length <= 0 || !Number.isInteger(layers) || layers <= 0) {
        currentQuotation = null;
        showToast('尺寸和页数必须为正数，页数必须为整数');
        return;
    }
    // 利润率

    let rate1 =
        Number(document.getElementById("profitRate1").value || 0) / 100;

    let rate2 =
        Number(document.getElementById("profitRate2").value || 0) / 100;

    let rate3 =
        Number(document.getElementById("profitRate3").value || 0) / 100;



    /*
        成本计算
    */


    // 砂布用量

    let gauzeQuantity =
        width * length * layers * 0.000001;



    // 砂布成本

    let gauzeCost =
        gauzeQuantity * gauzePrice;



    // 材料总成本（含税）

    let materialTax =
        gauzeCost
        + baseCost
        + glueCost
        + labelCost
        + cartonCost;



    // 材料总成本（不含税）

    let materialNoTax =
        materialTax / 1.13;



    // 其他成本

    let otherCost =
        laborCost
        + managementCost
        + shippingCost;



    // 含税含运总成本

    let totalCost =
        (materialNoTax + otherCost) * 1.13;



    /*
        报价计算
    */


    function calculatePrice(rate) {


        let profit =
            totalCost * rate;


        let price =
            totalCost * (1 + rate);


        let noInvoice =
            price / 1.08;


        return {

            profit,
            price,
            noInvoice

        };

    }



    let result1 = calculatePrice(rate1);
    let result2 = calculatePrice(rate2);
    let result3 = calculatePrice(rate3);



    /*
        显示结果
    */


    document.getElementById("gauzeQuantity").innerHTML =
        gauzeQuantity.toFixed(5);


    document.getElementById("gauzeCost").innerHTML =
        gauzeCost.toFixed(5);


    document.getElementById("materialTax").innerHTML =
        materialTax.toFixed(5);


    document.getElementById("materialNoTax").innerHTML =
        materialNoTax.toFixed(5);


    document.getElementById("otherCost").innerHTML =
        otherCost.toFixed(5);


    document.getElementById("totalCost").innerHTML =
        totalCost.toFixed(5);



    // 报价显示

    function showResult(num, rate, result) {


        document.getElementById(`rate${num}`).innerHTML =
            (rate * 100).toFixed(2) + "%";


        document.getElementById(`profit${num}`).innerHTML =
            result.profit.toFixed(5);


        document.getElementById(`price${num}`).innerHTML =
            result.price.toFixed(2);


        document.getElementById(`noInvoice${num}`).innerHTML =
            result.noInvoice.toFixed(2);


    }



    showResult(1, rate1, result1);
    showResult(2, rate2, result2);
    showResult(3, rate3, result3);

    currentQuotation = {

        width: width,

        length: length,

        pages: layers,


        abrasive:
        document.getElementById("abrasiveSelect").value,


        sandpaper_amount: gauzeQuantity,

        sandpaper_cost: gauzeCost,


        material_cost_tax: materialTax,

        material_cost_no_tax: materialNoTax,


        other_cost: otherCost,


        total_cost_tax_shipping: totalCost,


        // 中间商
        profit_rate:
        rate1 * 100,

        profit:
        result1.profit,

        sale_price:
        result1.price,

        no_invoice:
        result1.noInvoice,



        // 终端用户
        profit_rate_2:
        rate2 * 100,

        profit_2:
        result2.profit,

        sale_price_2:
        result2.price,

        no_invoice_2:
        result2.noInvoice

    };


}



// =======================
// 砂布价格选择
// =======================


const abrasiveSelect =
    document.getElementById("abrasiveSelect");


const materialSelect =
    document.getElementById("materialSelect");


const gritSelect =
    document.getElementById("gritSelect");


const gauzePrice =
    document.getElementById("gauzePrice");




// 加载磨料

fetch("/api/sandpaper/abrasives")
.then(res => {

    if (!res.ok) {
        throw new Error("加载磨料失败");
    }

    return res.json();

})
.then(data => {


    data.forEach(item => {


        let option =
            document.createElement("option");


        option.value =
            item.abrasive;


        option.textContent =
            item.abrasive;


        abrasiveSelect.appendChild(option);


    });


})
.catch(err => {

    console.error(err);

});





// 选择磨料 -> 编号

abrasiveSelect.addEventListener("change", ()=>{


    materialSelect.innerHTML =
        '<option value="">请选择编号</option>';


    gritSelect.innerHTML =
        '<option value="">请选择粒度</option>';


    gauzePrice.value = "";



    fetch(
        `/api/sandpaper/materials?abrasive=${
            encodeURIComponent(abrasiveSelect.value)
        }`
    )
    .then(res=>res.json())
    .then(data=>{


        data.forEach(item=>{


            let option =
                document.createElement("option");


            option.value =
                item.material_no;


            option.textContent =
                item.material_no;


            materialSelect.appendChild(option);


        });


    })
    .catch(err=>{

        console.error(err);

    });


});

// =======================
// 选择编号 -> 加载粒度
// =======================


materialSelect.addEventListener("change", ()=>{


    gritSelect.innerHTML =
        '<option value="">请选择粒度</option>';


    gauzePrice.value = "";



    fetch(
        `/api/sandpaper/grits?abrasive=${
            encodeURIComponent(abrasiveSelect.value)
        }&material=${
            encodeURIComponent(materialSelect.value)
        }`
    )
    .then(res=>{

        if(!res.ok){

            throw new Error("加载粒度失败");

        }

        return res.json();

    })
    .then(data=>{


        data.forEach(item=>{


            let option =
                document.createElement("option");


            option.value =
                item.grit;


            option.textContent =
                item.grit;


            gritSelect.appendChild(option);


        });


    })
    .catch(err=>{

        console.error(err);

    });


});







// =======================
// 选择粒度 -> 获取价格
// =======================


gritSelect.addEventListener("change", ()=>{


    fetch(
        `/api/sandpaper/price?abrasive=${
            encodeURIComponent(abrasiveSelect.value)
        }&material=${
            encodeURIComponent(materialSelect.value)
        }&grit=${
            encodeURIComponent(gritSelect.value)
        }`
    )
    .then(res=>{


        if(!res.ok){

            throw new Error("价格查询失败");

        }


        return res.json();


    })
    .then(data=>{


        if(data.price === undefined){

            throw new Error("没有找到价格");

        }


        gauzePrice.value =
            data.price;


    })
    .catch(err=>{


        console.error(err);


        gauzePrice.value = "";


    });


});






// =======================
// 产品规格选择
// =======================


const specSelect =
    document.getElementById("specSelect");





// 加载规格列表

fetch("/api/specs")
.then(res=>{


    if(!res.ok){

        throw new Error("规格加载失败");

    }


    return res.json();


})
.then(data=>{


    data.forEach(item=>{


        let option =
            document.createElement("option");


        option.value =
            item.spec;


        option.textContent =
            item.spec;


        specSelect.appendChild(option);


    });


})
.catch(err=>{


    console.error(err);


});








// =======================
// 选择规格 -> 自动填充
// =======================


specSelect.addEventListener("change", ()=>{


    if(specSelect.value === ""){

        return;

    }



    fetch(
        `/api/specs/detail?spec=${
            encodeURIComponent(specSelect.value)
        }`
    )
    .then(res=>{


        if(!res.ok){

            throw new Error("规格详情获取失败");

        }


        return res.json();


    })
    .then(data=>{


        // 产品尺寸

        document.getElementById("width").value =
            data.width;


        document.getElementById("length").value =
            data.length;


        document.getElementById("layers").value =
            data.pieces;



        // 材料成本

        document.getElementById("baseCost").value =
            data.base_cost;


        document.getElementById("glueCost").value =
            data.glue_cost;


        document.getElementById("labelCost").value =
            data.label_cost;


        document.getElementById("cartonCost").value =
            data.box_cost;




        // 其他成本

        document.getElementById("laborCost").value =
            data.labor_cost;


        document.getElementById("managementCost").value =
            data.management_cost;


        document.getElementById("shippingCost").value =
            data.shipping_cost;



    })
    .catch(err=>{


        console.error(err);


    });


});

async function saveQuotation(){


    if(!currentQuotation){

        showToast("请先计算报价");

        return;

    }


    let remark =
        document.getElementById("quotationRemark").value;



    if(!remark){

        showToast("请输入备注");

        return;

    }



    currentQuotation.remark = remark;



    const res =
        await fetch(
            "/api/quotations",
            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:
                JSON.stringify(currentQuotation)

            }
        );



    const data =
        await res.json();



    if(res.ok){


        showToast(
            "保存成功，报价编号："+data.id
        );


    }
    else{


        showToast(data.error);


    }


}

document.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        let button = document.querySelector(
            'button[onclick="calculate()"]'
        );

        if (button) {
            event.preventDefault();
            calculate();
        }

    }

});
