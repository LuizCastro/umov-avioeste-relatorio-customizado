'use strict';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');

async function getCabecalho(schema, client, pedido) {
    let sql = `
    select
        task.tsk_integrationid as numeroPedido,
            agent.age_name as vendedor,
            (
                select cfv.cfv_internalvalue as categoriaVendas
            from ${schema}.customfieldvalue cfv
            inner join ${schema}.customfield cfd on cfd.cfd_id = cfv.cfd_id
            and cfd.cfd_integrationid = 'categoriaVendas' and cfv.cfv_registerid = task.tsk_id
            limit 1
        ) categoriaVendas,
            (
                select cfv.cfv_internalvalue as categoriaVendas
            from ${schema}.customfieldvalue cfv
            inner join ${schema}.customfield cfd on cfd.cfd_id = cfv.cfd_id
            and cfd.cfd_integrationid = 'integradoraVendas' and cfv.cfv_registerid = task.tsk_id
            limit 1
        ) integradora,
            (
                select cfv.cfv_internalvalue as categoriaVendas
            from ${schema}.customfieldvalue cfv
            inner join ${schema}.customfield cfd on cfd.cfd_id = cfv.cfd_id
            and cfd.cfd_integrationid = 'projetoVendas' and cfv.cfv_registerid = task.tsk_id
            limit 1
        ) projeto
    from ${schema}.task 
    left join ${schema}.agent on  agent.age_id = task.age_id
    where '${pedido}' in (task.tsk_integrationid,task.tsk_id) limit 1; `;
    const res = await client.query(sql);
    if (!res.rows || res.rows.length === 0) {
        return {
        };
    }
    return {
        numeroPedido: res.rows[0].numeroPedido,
        vendedor: res.rows[0].vendedor || '',
        categoriaVendas: res.rows[0].categoriaVendas || '',
        integradora: res.rows[0].integradora || '',
        projeto: res.rows[0].projeto || ''
    };
}

async function getDadosCliente(schema, client, pedido) {
    let sql = `
        select
        local.loc_description as cliente,
            CONCAT(local.loc_street, ' ', local.loc_streetnumber, ' ', local.loc_streetnumbercompl) as endereco,
            local.loc_city as municipio,
            local.loc_zipcode as cep,
            local.loc_state as uf,
            (
                select cfv.cfv_internalvalue
            from ${schema}.customfieldvalue cfv
            inner join ${schema}.customfield cfd on cfd.cfd_id = cfv.cfd_id
            and cfd.cfd_integrationid = 'CPFCNPJ' and cfv.cfv_registerid = task.loc_id
            limit 1
        ) cpf,
            (
                select cfv.cfv_internalvalue
            from ${schema}.customfieldvalue cfv
            inner join ${schema}.customfield cfd on cfd.cfd_id = cfv.cfd_id
            and cfd.cfd_integrationid = 'IE' and cfv.cfv_registerid = task.loc_id
            limit 1
        ) ie,
            (
                select cfv.cfv_internalvalue
            from ${schema}.customfieldvalue cfv
            inner join ${schema}.customfield cfd on cfd.cfd_id = cfv.cfd_id
            and cfd.cfd_integrationid = 'CONTATO' and cfv.cfv_registerid = task.loc_id
            limit 1
        ) contato,
            local.loc_phone as telefone,
            local.loc_mobilephone as celular
    from ${schema}.task
    left join ${schema}.local on  local.loc_id = task.loc_id
    where '${pedido}' in (task.tsk_integrationid,task.tsk_id) LIMIT 1 `;
    const res = await client.query(sql);
    if (!res.rows || res.rows.length === 0) return {};
    let rows = res.rows;
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

async function getParticipantes(schema, client, pedido) {
    let sql = `
    select activityfield.acf_integrationid as campo,
            (select historyvalue.htv_externalvalue 
            from  ${schema}.history
            inner join ${schema}.historyvalue on  history.hty_id = historyvalue.hty_id
            and 	historyvalue.acf_id = activityfield.acf_id
            and 	history.tsk_id in (select tsk_id from ${schema}.task where '${pedido}' in (task.tsk_integrationid,task.tsk_id) )
            order by length(historyvalue.htv_externalvalue) desc
            limit 1
        ) valor
    from ${schema}.activityfield
    where(activityfield.acf_integrationid like 'participante_%')
    order by activityfield.acf_displayorder `;
    let result = [
        { Nome: '', Empresa: '', Assinatura: '' },
        { Nome: '', Empresa: '', Assinatura: '' },
        { Nome: '', Empresa: '', Assinatura: '' },
        { Nome: '', Empresa: '', Assinatura: '' },
        { Nome: '', Empresa: '', Assinatura: '' }
    ];
    const res = await client.query(sql);
    let rows = res.rows;
    for (const row of rows) {
        var index = row.campo.substr(row.campo.length - 1);
        if (row.campo.includes('nome') && row.valor) {
            result[index].Nome = row.valor;
        } else if (row.campo.includes('empresa') && row.valor) {
            result[index].Empresa = row.valor;
        } else if (row.campo.includes('assinatura') && row.valor) {
            result[index].Assinatura = row.valor;
        }
    }
    return result;
}

async function getInformacoesPreliminares(schema, client, pedido) {
    let sql = `
    select acf_integrationid campo,
            (select historyvalue.htv_externalvalue
        from  history
        inner join historyvalue on  history.hty_id = historyvalue.hty_id
        and 	historyvalue.acf_id = activityfield.acf_id
        and 	history.tsk_id = taskactivity.tsk_id
        order by length(historyvalue.htv_externalvalue) desc limit 1
    ) valor
    from taskactivity
    inner join task on taskactivity.tsk_id = task.tsk_id and '${pedido}' in (task.tsk_integrationid,task.tsk_id)
            inner join activity on activity.act_id = taskactivity.act_id
    inner join activitysection on activity.act_id = activitysection.act_id
    inner join activityfield on activitysection.acs_id = activityfield.acs_id
    where activity.act_integrationid = 'entrega_tecnica'
    and activitysection.acs_description ilike '%preliminares%'
    and activityfield.acf_active = '1'
    order by activityfield.acf_displayorder`;
    const res = await client.query(sql);
    let camposRows = res.rows;
    if (!camposRows || camposRows.length === 0) return {};
    const camposMap = {};
    (camposRows || []).forEach(c => {
        camposMap[c.campo] = c.valor;
    });
    return camposMap;

}

async function getSecao(schema, client, pedido) {
    // Busca atividades principais
    let sql = `
    select activitysection.acs_displayorder secao_ordem , activitysection.acs_description secao_nome,activitysection.acs_integrationid secao_id, activityfield.acf_displayorder ordem, acf_integrationid campo, acf_description descricao,
            (select historyvalue.htv_externalvalue
            from  ${schema}.history
            inner join ${schema}.historyvalue on  history.hty_id = historyvalue.hty_id
            and 	historyvalue.acf_id = activityfield.acf_id
            and 	history.tsk_id = task.tsk_id
            order by length(historyvalue.htv_externalvalue) desc limit 1
        ) valor,
        activityfield.acf_displayorder as ordem
    from ${schema}.taskactivity
    inner join ${schema}.task on taskactivity.tsk_id = task.tsk_id and '${pedido}' in (task.tsk_integrationid,task.tsk_id)
            inner join ${schema}.activity on activity.act_id = taskactivity.act_id
    inner join ${schema}.activitysection on activity.act_id = activitysection.act_id
    inner join ${schema}.activityfield on activitysection.acs_id = activityfield.acs_id
    where activity.act_integrationid = 'entrega_tecnica'
    and COALESCE(activitysection.acs_integrationid, '') not in ('participantes', 'informacoes_preliminares', 'informacoes_gerais', 'finalizar_entrega_tecnica', '')
    and COALESCE(acf_integrationid, '') not in ('')
    and activityfield.acf_active = '1'
    order by activitysection.acs_displayorder, activityfield.acf_displayorder`;
    const res = await client.query(sql);
    let atividades = res.rows;

    if (!atividades || atividades.length === 0) return {};

    let result = {};
    for (const atv of atividades) {
        let index = atv.secao_id;
        if (result[index] == undefined) {
            result[index] = {
                ordem: atv.secao_ordem,
                id: atv.secao_id,
                descricao: atv.secao_nome,
                itens: [],
            };
        }
        result[index].itens.push({
            ordem: atv.ordem,
            campo: atv.campo,
            descricao: atv.descricao,
            valor: atv.valor
        });
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

        const schema = 'u44323';
        const params = {
            user: 'lambda',
            host: '44.197.71.129',
            database: 'prod_umov_dbview',
            password: 'L@MBD@uMov',
            port: 6432,
        };
        const pool = new Pool(params);
        client = await pool.connect();
        await client.query(`SET search_path TO ${schema};`);

        const cabecalho = await getCabecalho(schema, client, pedido);
        const dadosCliente = await getDadosCliente(schema, client, pedido);
        const participantes = await getParticipantes(schema, client, pedido);
        const informacoesPreliminares = await getInformacoesPreliminares(schema, client, pedido);
        const secoes = await getSecao(schema, client, pedido);

        const payload = {
            pedido,
            cabecalho,
            dadosCliente,
            participantes,
            informacoesPreliminares,
            secoes
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