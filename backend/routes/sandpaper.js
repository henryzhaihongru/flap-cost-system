const express = require("express");
const router = express.Router();

const db = require("../../database/db");
const { requireAdmin } = require("../auth");


// =============================
// 用户端查询
// =============================


// 获取所有磨料
router.get("/abrasives", (req,res)=>{

    db.all(
        `
        SELECT DISTINCT abrasive
        FROM sandpaper_prices
        ORDER BY abrasive
        `,
        [],
        (err,rows)=>{

            if(err){
                return res.status(500).json({
                    error:err.message
                });
            }

            res.json(rows);

        }
    );

});




// 根据磨料获取编号
router.get("/materials",(req,res)=>{

    const { abrasive } = req.query;


    if(!abrasive){

        return res.status(400).json({
            error:"Missing abrasive"
        });

    }


    db.all(
        `
        SELECT DISTINCT material_no
        FROM sandpaper_prices
        WHERE abrasive=?
        ORDER BY material_no
        `,
        [
            abrasive
        ],
        (err,rows)=>{

            if(err){
                return res.status(500).json({
                    error:err.message
                });
            }

            res.json(rows);

        }
    );

});




// 根据磨料编号获取粒度
router.get("/grits",(req,res)=>{

    const {
        abrasive,
        material
    }=req.query;


    if(!abrasive || !material){

        return res.status(400).json({
            error:"Missing parameters"
        });

    }


    db.all(
        `
        SELECT DISTINCT grit
        FROM sandpaper_prices
        WHERE abrasive=?
        AND material_no=?
        ORDER BY grit
        `,
        [
            abrasive,
            material
        ],
        (err,rows)=>{

            if(err){
                return res.status(500).json({
                    error:err.message
                });
            }

            res.json(rows);

        }
    );

});




// 查询价格
router.get("/price",(req,res)=>{

    const {
        abrasive,
        material,
        grit
    }=req.query;



    if(!abrasive || !material || !grit){

        return res.status(400).json({
            error:"Missing parameters"
        });

    }


    db.get(
        `
        SELECT price
        FROM sandpaper_prices
        WHERE abrasive=?
        AND material_no=?
        AND grit=?
        `,
        [
            abrasive,
            material,
            grit
        ],
        (err,row)=>{


            if(err){

                return res.status(500).json({
                    error:err.message
                });

            }


            if(!row){

                return res.status(404).json({
                    error:"Price not found"
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
        FROM sandpaper_prices
        ORDER BY id
        `,
        [],
        (err,rows)=>{

            if(err){

                return res.status(500).json({
                    error:err.message
                });

            }

            res.json(rows);

        }
    );


});




// 修改
router.put("/:id", requireAdmin, (req,res)=>{


    const id=req.params.id;


    const {
        abrasive,
        material_no,
        grit,
        price
    }=req.body;



    if(
        !abrasive ||
        !material_no ||
        !grit ||
        isNaN(price)
    ){

        return res.status(400).json({
            error:"Invalid data"
        });

    }



    db.run(
        `
        UPDATE sandpaper_prices

        SET
        abrasive=?,
        material_no=?,
        grit=?,
        price=?

        WHERE id=?
        `,
        [
            abrasive,
            material_no,
            grit,
            Number(price),
            id
        ],
        function(err){

            if(err){

                return res.status(500).json({
                    error:err.message
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


    const {
        abrasive,
        material_no,
        grit,
        price
    }=req.body;



    if(
        !abrasive ||
        !material_no ||
        !grit ||
        isNaN(price)
    ){

        return res.status(400).json({
            error:"Invalid data"
        });

    }



    db.get(
        `
        SELECT id
        FROM sandpaper_prices

        WHERE abrasive=?
        AND material_no=?
        AND grit=?
        `,
        [
            abrasive,
            material_no,
            grit
        ],
        (err,row)=>{


            if(err){

                return res.status(500).json({
                    error:err.message
                });

            }



            if(row){

                return res.status(409).json({
                    error:"This sandpaper already exists"
                });

            }



            db.run(
                `
                INSERT INTO sandpaper_prices

                (
                    abrasive,
                    material_no,
                    grit,
                    price
                )

                VALUES(?,?,?,?)
                `,
                [
                    abrasive,
                    material_no,
                    grit,
                    Number(price)
                ],
                function(err){

                    if(err){

                        return res.status(500).json({
                            error:err.message
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
        DELETE FROM sandpaper_prices
        WHERE id=?
        `,
        [
            id
        ],
        function(err){


            if(err){

                return res.status(500).json({
                    error:err.message
                });

            }


            res.json({

                message:"Deleted successfully"

            });


        }
    );


});



module.exports=router;
