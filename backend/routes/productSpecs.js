const express = require("express");
const router = express.Router();

const db = require("../../database/db");
const { requireAdmin } = require("../auth");



// =============================
// 用户端
// =============================


// 获取所有规格
router.get("/",(req,res)=>{


    db.all(
        `
        SELECT spec
        FROM product_specs
        ORDER BY id
        `,
        [],
        (err,rows)=>{


            if(err){

                return res.status(500).json({
                    error:"Database error"
                });

            }


            res.json(rows);


        }
    );


});




// 获取详细规格
router.get("/detail",(req,res)=>{


    const {spec}=req.query;


    if(!spec){

        return res.status(400).json({
            error:"Missing spec"
        });

    }



    db.get(
        `
        SELECT *
        FROM product_specs
        WHERE spec=?
        `,
        [
            spec
        ],
        (err,row)=>{


            if(err){

                return res.status(500).json({
                    error:"Database error"
                });

            }



            if(!row){

                return res.status(404).json({
                    error:"Spec not found"
                });

            }


            res.json(row);


        }
    );


});





// =============================
// 管理员
// =============================


// 获取全部
router.get("/all", requireAdmin, (req,res)=>{


    db.all(
        `
        SELECT *
        FROM product_specs
        ORDER BY id
        `,
        [],
        (err,rows)=>{


            if(err){

                return res.status(500).json({
                    error:"Database error"
                });

            }


            res.json(rows);


        }
    );


});




// 数据验证函数

function validateSpec(data){


    const numbers=[

        "width",
        "length",
        "pieces",
        "base_cost",
        "glue_cost",
        "label_cost",
        "box_cost",
        "labor_cost",
        "management_cost",
        "shipping_cost"

    ];



    if(!data.spec){

        return false;

    }



    for(let item of numbers){


        if(
            data[item]===undefined ||
            isNaN(data[item])
        ){

            return false;

        }


        if(Number(data[item])<0){

            return false;

        }


    }



    if(
        Number(data.width)<=0 ||
        Number(data.length)<=0 ||
        Number(data.pieces)<=0
    ){

        return false;

    }


    return true;

}





// 修改
router.put("/:id", requireAdmin, (req,res)=>{


    const id=req.params.id;


    const data=req.body;


    if(!validateSpec(data)){


        return res.status(400).json({
            error:"Invalid data"
        });


    }



    db.run(
        `
        UPDATE product_specs

        SET

        spec=?,
        width=?,
        length=?,
        pieces=?,
        base_cost=?,
        glue_cost=?,
        label_cost=?,
        box_cost=?,
        labor_cost=?,
        management_cost=?,
        shipping_cost=?

        WHERE id=?

        `,
        [

            data.spec,
            Number(data.width),
            Number(data.length),
            Number(data.pieces),
            Number(data.base_cost),
            Number(data.glue_cost),
            Number(data.label_cost),
            Number(data.box_cost),
            Number(data.labor_cost),
            Number(data.management_cost),
            Number(data.shipping_cost),
            id

        ],
        function(err){


            if(err){

                return res.status(500).json({
                    error:"Database error"
                });

            }


            res.json({
                message:"Updated successfully"
            });


        }
    );


});






// 新增

router.post("/", requireAdmin, (req,res)=>{


    const data=req.body;



    if(!validateSpec(data)){


        return res.status(400).json({
            error:"Invalid data"
        });


    }



    // 防止重复规格

    db.get(
        `
        SELECT id
        FROM product_specs
        WHERE spec=?
        `,
        [
            data.spec
        ],
        (err,row)=>{


            if(err){

                return res.status(500).json({
                    error:"Database error"
                });

            }



            if(row){

                return res.status(409).json({
                    error:"Spec already exists"
                });

            }




            db.run(
                `
                INSERT INTO product_specs

                (
                spec,
                width,
                length,
                pieces,
                base_cost,
                glue_cost,
                label_cost,
                box_cost,
                labor_cost,
                management_cost,
                shipping_cost
                )

                VALUES(?,?,?,?,?,?,?,?,?,?,?)

                `,
                [

                data.spec,
                Number(data.width),
                Number(data.length),
                Number(data.pieces),
                Number(data.base_cost),
                Number(data.glue_cost),
                Number(data.label_cost),
                Number(data.box_cost),
                Number(data.labor_cost),
                Number(data.management_cost),
                Number(data.shipping_cost)

                ],
                function(err){


                    if(err){

                        return res.status(500).json({
                            error:"Database error"
                        });

                    }



                    res.json({

                        message:"Created successfully",
                        id:this.lastID

                    });


                }
            );


        }
    );


});





// 删除

router.delete("/:id", requireAdmin, (req,res)=>{


    const id=req.params.id;


    db.run(
        `
        DELETE FROM product_specs
        WHERE id=?
        `,
        [
            id
        ],
        function(err){


            if(err){

                return res.status(500).json({
                    error:"Database error"
                });

            }



            res.json({

                message:"Deleted successfully"

            });


        }
    );


});





module.exports=router;
