const express = require("express");
const router = express.Router();

const db = require("../../database/db");
const { requireAdmin } = require("../auth");


// =============================
// 保存报价
// =============================

router.post("/", requireAdmin, (req,res)=>{

    const data = req.body;
    const numericFields = ['width','length','pages','sandpaper_amount','sandpaper_cost','material_cost_tax','material_cost_no_tax','other_cost','total_cost_tax_shipping','profit_rate','profit','sale_price','no_invoice','profit_rate_2','profit_2','sale_price_2','no_invoice_2'];
    if (!data || numericFields.some(key => typeof data[key] !== 'number' || !Number.isFinite(data[key]) || data[key] < 0) || data.width <= 0 || data.length <= 0 || !Number.isInteger(data.pages) || data.pages <= 0 || typeof data.remark !== 'string' || !data.remark.trim() || data.remark.length > 500 || typeof data.abrasive !== 'string' || data.abrasive.length > 100) {
        return res.status(400).json({error:'报价参数不合法'});
    }


    db.run(
        `
        INSERT INTO quotations

        (
            remark,

            width,
            length,
            pages,

            abrasive,

            sandpaper_amount,
            sandpaper_cost,

            material_cost_tax,
            material_cost_no_tax,

            other_cost,

            total_cost_tax_shipping,

            profit_rate,
            profit,
            sale_price,
            no_invoice,

            profit_rate_2,
            profit_2,
            sale_price_2,
            no_invoice_2
        )

        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)

        `,
        [

            data.remark,

            Number(data.width),
            Number(data.length),
            Number(data.pages),

            data.abrasive,

            Number(data.sandpaper_amount),
            Number(data.sandpaper_cost),

            Number(data.material_cost_tax),
            Number(data.material_cost_no_tax),

            Number(data.other_cost),

            Number(data.total_cost_tax_shipping),

            Number(data.profit_rate),
            Number(data.profit),

            Number(data.sale_price),

            Number(data.no_invoice),

            Number(data.profit_rate_2),

            Number(data.profit_2),

            Number(data.sale_price_2),

            Number(data.no_invoice_2)


        ],

        function(err){

            if(err){

                console.error(err);

                return res.status(500).json({
                    error:"Database error"
                });

            }


            res.json({

                message:"Quotation saved",

                id:this.lastID

            });


        }

    );


});




// =============================
// 获取报价记录
// =============================

router.get("/", requireAdmin, (req,res)=>{


    db.all(

        `
        SELECT *

        FROM quotations

        ORDER BY id DESC

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




// =============================
// 删除报价
// =============================

router.delete("/:id", requireAdmin, (req,res)=>{


    const id=req.params.id;


    db.run(

        `
        DELETE FROM quotations

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



module.exports = router;
