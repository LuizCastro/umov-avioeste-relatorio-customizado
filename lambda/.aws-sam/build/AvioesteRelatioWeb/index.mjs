'use strict';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');

const params = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
};
console.log(params);
const pool = new Pool(params);

async function getCabecalho(pool, pedido) {
    const sql = `
    select
        task.tsk_integrationid as numeroPedido,
            agent.age_name as vendedor,
            (
                select cfv.cfv_internalvalue as categoriaVendas
            from customfieldvalue cfv
            inner join customfield cfd on cfd.cfd_id = cfv.cfd_id
            and cfd.cfd_integrationid = 'categoriaVendas' and cfv.cfv_registerid = task.tsk_id
            limit 1
        ) categoriaVendas,
            (
                select cfv.cfv_internalvalue as categoriaVendas
            from customfieldvalue cfv
            inner join customfield cfd on cfd.cfd_id = cfv.cfd_id
            and cfd.cfd_integrationid = 'integradoraVendas' and cfv.cfv_registerid = task.tsk_id
            limit 1
        ) integradora,
            (
                select cfv.cfv_internalvalue as categoriaVendas
            from customfieldvalue cfv
            inner join customfield cfd on cfd.cfd_id = cfv.cfd_id
            and cfd.cfd_integrationid = 'projetoVendas' and cfv.cfv_registerid = task.tsk_id
            limit 1
        ) projeto
    from task 
    left join agent on  agent.age_id = task.age_id
    where task.tsk_integrationid = '${pedido}' limit 1 `;
    const [rows] = await pool.query(sql);
    if (!rows || rows.length === 0) {
        return {
        };
    }
    return {
        numeroPedido: rows[0].numeroPedido,
        vendedor: rows[0].vendedor || '',
        categoriaVendas: rows[0].categoriaVendas || '',
        integradora: rows[0].integradora || '',
        projeto: rows[0].projeto || ''
    };
}

async function getDadosCliente(pool, pedido) {
    const sql = `
        select
        local.loc_description as cliente,
            CONCAT(local.loc_street, ' ', local.loc_streetnumber, ' ', local.loc_streetnumbercompl) as endereco,
            local.loc_city as municipio,
            local.loc_zipcode as cep,
            local.loc_state as uf,
            (
                select cfv.cfv_internalvalue
            from customfieldvalue cfv
            inner join customfield cfd on cfd.cfd_id = cfv.cfd_id
            and cfd.cfd_integrationid = 'CPFCNPJ' and cfv.cfv_registerid = task.loc_id
            limit 1
        ) cpf,
            (
                select cfv.cfv_internalvalue
            from customfieldvalue cfv
            inner join customfield cfd on cfd.cfd_id = cfv.cfd_id
            and cfd.cfd_integrationid = 'IE' and cfv.cfv_registerid = task.loc_id
            limit 1
        ) ie,
            (
                select cfv.cfv_internalvalue
            from customfieldvalue cfv
            inner join customfield cfd on cfd.cfd_id = cfv.cfd_id
            and cfd.cfd_integrationid = 'CONTATO' and cfv.cfv_registerid = task.loc_id
            limit 1
        ) contato,
            local.loc_phone as telefone,
            local.loc_mobilephone as celular
    from task
    left join local on  local.loc_id = task.loc_id
    where task.tsk_integrationid = '${pedido}' LIMIT 1
                `;
    const [rows] = await pool.query(sql);
    if (!rows || rows.length === 0) return {};
    return {
        cliente: rows[0].cliente || '',
        endereco: rows[0].endereco || '',
        municipio: rows[0].municipio || '',
        cep: rows[0].cep || '',
        uf: rows[0].uf || '',
        cpf: rows[0].cpf || '',
        ie: rows[0].ie || '',
        contato: rows[0].contato || '',
        telefone: rows[0].telefone || '',
        celular: rows[0].celular || ''
    };
}

async function getParticipantes(pool, pedido) {
    const sql = `
    select activityfield.acf_integrationid as campo,
            (select historyvalue.htv_externalvalue 
            from  history
            inner join historyvalue on  history.hty_id = historyvalue.hty_id
            and 	historyvalue.acf_id = activityfield.acf_id
            and 	history.tsk_id in (select tsk_id from task where task.tsk_integrationid = '${pedido}' )
            order by length(historyvalue.htv_externalvalue) desc
            limit 1
        ) valor
    from activityfield
    where(activityfield.acf_integrationid like 'participante_%')
    order by activityfield.acf_displayorder `;
    let result = [];
    const [rows] = await pool.query(sql);
    result.push({ Nome: '', Empresa: '', Assinatura: '' });
    result.push({ Nome: '', Empresa: '', Assinatura: '' });
    result.push({ Nome: '', Empresa: '', Assinatura: '' });
    result.push({ Nome: '', Empresa: '', Assinatura: '' });
    result.push({ Nome: '', Empresa: '', Assinatura: '' });
    for (const participante of rows) {
        var index = r.campo.charAt(r.campo - 1);
        if (r.campo.includes('nome')) {
            result[index].Nome = r.valor;
        } else if (r.campo.includes('empresa')) {
            result[index].Empresa = r.valor;
        } else if (r.campo.includes('assinatura')) {
            result[index].Assinatura = r.valor;
        }
    }
    return result;
}

async function getInformacoesPreliminares(pool, pedido) {
    const sql = `
    select acf_integrationid campo,
            (select historyvalue.htv_externalvalue
        from  history
        inner join historyvalue on  history.hty_id = historyvalue.hty_id
        and 	historyvalue.acf_id = activityfield.acf_id
        and 	history.tsk_id = taskactivity.tsk_id
        order by length(historyvalue.htv_externalvalue) desc limit 1
    ) valor
    from taskactivity
    inner join task on taskactivity.tsk_id = task.tsk_id and task.tsk_integrationid = '${pedido}'
            inner join activity on activity.act_id = taskactivity.act_id
    inner join activitysection on activity.act_id = activitysection.act_id
    inner join activityfield on activitysection.acs_id = activityfield.acs_id
    where activity.act_integrationid = 'entrega_tecnica'
    and activitysection.acs_description ilike '%preliminares%'
    and activityfield.acf_active = '1'
    order by activityfield.acf_displayorder`;
    const [camposRows] = await pool.query(sql);
    if (!camposRows || camposRows.length === 0) return {};
    const camposMap = {};
    (camposRows || []).forEach(c => {
        camposMap[c.campo] = c.valor;
    });
    return camposMap;

}
async function getAtividades(pool, pedido) {
    const sql = `
    select acf_integrationid campo,
            (select historyvalue.htv_externalvalue
        from  history
        inner join historyvalue on  history.hty_id = historyvalue.hty_id
        and 	historyvalue.acf_id = activityfield.acf_id
        and 	history.tsk_id = taskactivity.tsk_id
        order by length(historyvalue.htv_externalvalue) desc limit 1
    ) valor
    from taskactivity
    inner join task on taskactivity.tsk_id = task.tsk_id and task.tsk_integrationid = '${pedido}'
            inner join activity on activity.act_id = taskactivity.act_id
    inner join activitysection on activity.act_id = activitysection.act_id
    inner join activityfield on activitysection.acs_id = activityfield.acs_id
    where activity.act_integrationid = 'entrega_tecnica'
    and activitysection.acs_description ilike '%preliminares%'
    and activityfield.acf_active = '1'
    order by activityfield.acf_displayorder`;
    const [camposRows] = await pool.query(sql);
    if (!camposRows || camposRows.length === 0) return {};
    const camposMap = {};
    (camposRows || []).forEach(c => {
        camposMap[c.campo] = c.valor;
    });
    return camposMap;

}


async function getSecao(pool, pedido) {
    // Busca atividades principais
    const sql = `
    select activitysection.acs_integrationid secao, acf_integrationid campo, acf_description descricao,
            (select historyvalue.htv_externalvalue
            from  history
            inner join historyvalue on  history.hty_id = historyvalue.hty_id
            and 	historyvalue.acf_id = activityfield.acf_id
            and 	history.tsk_id = task.tsk_id
            order by length(historyvalue.htv_externalvalue) desc limit 1
        ) valor
    from taskactivity
    inner join task on taskactivity.tsk_id = task.tsk_id and task.tsk_integrationid = '${pedido}'
            inner join activity on activity.act_id = taskactivity.act_id
    inner join activitysection on activity.act_id = activitysection.act_id
    inner join activityfield on activitysection.acs_id = activityfield.acs_id
    where activity.act_integrationid = 'entrega_tecnica'
    and COALESCE(activitysection.acs_integrationid, '') not in ('participantes', 'informacoes_preliminares', 'informacoes_gerais', 'finalizar_entrega_tecnica', '')
    and COALESCE(acf_integrationid, '') not in ('')
    and activityfield.acf_active = '1'
    order by activitysection.acs_displayorder, activityfield.acf_displayorder`;
    const [atividades] = await pool.query(sql);

    const result = {};
    if (!atividades || atividades.length === 0) return result;

    for (const atv of atividades) {
        const atvId = atv.id;
        const campo = {};
        campo[atv.campo] = atv.valor;
        result[atv.secao].push(campo);
    }

    return result;
}
export const handler = async (event) => {
    // CORS: ajustar origem em produção
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,OPTIONS"
    };

    // Preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }
    let client;
    try {
        const pedido = (event.queryStringParameters && event.queryStringParameters.pedido) ||
            (event.queryStringParameters && event.queryStringParameters.pedidoId) ||
            null;

        if (!pedido) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Parâmetro 'pedido' é obrigatório" })
            };
        }
        client = await pool.connect();
        await client.query(`SET search_path TO ${process.env.DB_SCHEMA};`);
        const cabecalho = await getCabecalho(client, pedido);
        const dadosCliente = await getDadosCliente(client, pedido);
        const participantes = await getParticipantes(client, pedido);
        const informacoesPreliminares = await getInformacoesPreliminares(client, pedido);
        const atividades = await getAtividades(client, pedido);
        const payload = {
            pedido,
            cabecalho,
            dadosCliente,
            participantes,
            informacoesPreliminares,
            atividades
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(payload)
        };

    } catch (err) {
        console.error("Erro no Lambda:", err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Erro interno do servidor", detail: err.message })
        };
    } finally {
        if (client) {
            client.release();
        }
    }
};