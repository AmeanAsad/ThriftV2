import requests
import json
import numpy as np
import operator
from rest_framework.decorators import api_view
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import csrf_protect

from rest_framework.response import Response
import json


from pulp import * 
from decimal import Decimal, ROUND_HALF_UP


def get_customer_average_spending(customer_id):
    response = requests.get('https://api.td-davinci.com/api/customers/' + customer_id + "/transactions",
    headers = { 'Authorization': '' })
    data = json.loads(response.text)
    
    results = data['result']
    
    results.sort(key=lambda r: r['originationDateTime'])

    
    monthly_periods = [i for i in range(27,32)]
    amounting_periods = list(map(lambda x: float(len(results)/x), monthly_periods))
    minimization_factor = list(map(lambda x: x-int(x), amounting_periods))
    result_index = minimization_factor.index(min(minimization_factor))   
    period = monthly_periods[result_index]
    iteration_factor = int(amounting_periods[result_index])
   
    categories = {}
    totals =  []
    transfer_total = 0.0
    counter = 0
    
    for i in range(iteration_factor):
        total=0
        for x in range(period):
            try:
                category = results[counter]["categoryTags"][0]    
               
            except:
                category = "unknown"

            
            if category == "Income":
                amount = 0
            elif category == "Taxes":
                amount = 0
            elif category == "Transfer":
                amount = float(results[counter]['currencyAmount']/2)

            else:
                amount = results[counter]['currencyAmount']
            total+=float(abs(amount))
            transfer_total += float(abs(amount))
            try:
                categories[category]["Spendings"][str(i)].append(float(abs(amount)))
                categories[category]["total"] += float(abs(amount))
                categories[category]["frequency"] +=1
            except KeyError:
                period_dict = {}
                for z in range(iteration_factor):
                    period_dict[str(z)] = []
                categories[category] = {"Spendings": period_dict}
                categories[category]["Spendings"][str(i)].append(float(abs(amount)))
                categories[category]["total"] = float(abs(amount))
                categories[category]["frequency"] =1


            counter+=1
        totals.append(total)
    for category in categories.keys():
        frequency =  categories[category]["frequency"] 
        categories[category]['average_frequency'] = round(float(frequency/iteration_factor),4)
      
    return categories, totals, transfer_total
            
    
    
def get_final_categorization(customer_id):
    customer_categories,totals,transfer_total = get_customer_average_spending(customer_id)
    categories = customer_categories.keys()
    modified_data_category = {}
    
    for key in categories:
        modified_data_category[key] = {"period_totals": []}
        period_list = customer_categories[key]['Spendings']
        total = customer_categories[key]['total']
        frequency = customer_categories[key]['frequency']
        avg_frequency = customer_categories[key]['average_frequency']
        period_means = []
        revised_percentage = round(float(total/transfer_total)*100, 4)
        
        modified_data_category[key]["revised_percentage"] = revised_percentage
        modified_data_category[key]["total"] = total
        modified_data_category[key]["avg_frequency"] = avg_frequency


        for period in period_list.keys():
            modified_data_category[key]["period_totals"].append(round(sum(period_list[period]),2))
           
            
            try:
                period_mean = round(float(sum(period_list[period])/len(period_list[period])),2)      
                period_means.append(period_mean)
            except ZeroDivisionError:
                period_means.append(0)
        try:
            average_payment = round(float(total/frequency),2)
            modified_data_category[key]["average_payment"] = average_payment
            priority = 1 - float(average_payment/total)
            modified_data_category[key]["priority"] = priority
            modified_data_category[key]["optimization_priority"] = revised_percentage*priority


            

        except ZeroDivisionError:
             modified_data_category[key]["average_payment"] = 0
             modified_data_category[key]["priority"] = 0
             modified_data_category[key]["optimization_priority"] = 0

        
        
        

        period_totals = np.array(modified_data_category[key]["period_totals"])
        modified_data_category[key]["monthly_average"] = round(np.mean(period_totals), 2)

        array_totals = np.array(totals)
        average_percentage =  float(sum((period_totals/array_totals))/len(totals))
        
        modified_data_category[key]["average_percentage"] = round(100*average_percentage,2)
        
        final_category = {}
    
        for i in modified_data_category.keys():
            
            if i != "Income" and i!= "Taxes":
                final_category[i] = modified_data_category[i]
            else:
                continue
    return final_category


def create_savings_plan(total, period, customer_id):
    items = get_final_categorization(customer_id)
    savings = total
    amounting_period = period
    problem = LpProblem("Financial Savings", LpMaximize)
    variables = []
    priorities = []
    average_frequencies = []
    average_payments = []
    print(items)
    for i in items.keys():
        variables.append(i)
        priorities.append(items[i]["optimization_priority"])
        average_payments.append(items[i]["average_payment"])
        average_frequencies.append(items[i]['avg_frequency'])
    var = LpVariable.dicts("Variables", variables, lowBound=0, cat="continuous")
    p = dict(zip(variables, priorities))
    a_p = dict(zip(variables, average_payments))
    a_f = dict(zip(variables, average_frequencies))  
    problem += lpSum(p[i]*var[i] for i in var)
    problem += lpSum(var[i]*a_p[i] for i in var)== savings, "Savings Amount"
    
    for i in var:
        problem+= float(1/amounting_period)*var[i] <= float(a_f[i]/2)
    
    problem.solve()
    savings_plan = {}
    if (LpStatus[problem.status]) == "Infeasible":
        savings_plan['Infeasible'] = 0 
        return savings_plan 
    
    for variable in problem.variables():
        if variable.varValue>0:
            var =variable.name.split("_")
            seperator = " "
            var = seperator.join(var[1:])
#            decimal_value = Decimal(variable.varValue).to_integral_value(rounding=ROUND_HALF_UP)
            decimal_value =round(float(variable.varValue), 2)
            savings_plan[var]={'payments':float(decimal_value)}
    
    for item in savings_plan.keys():
        reduction_payment = float(savings_plan[item]['payments']*items[item]['average_payment'])
        projected_payment = float(items[item]['average_payment']*items[item]['avg_frequency']*amounting_period)
        budget = projected_payment - reduction_payment
        savings_plan[item]['projected'] = round(projected_payment,2)
        savings_plan[item]['reduction'] = round(reduction_payment,2)
        savings_plan[item]['budget'] = round(budget,2)
        savings_plan[item]['monthly_budget'] = round(float(budget/amounting_period),2)
        savings_plan[item]['avg_payment'] = items[item]['average_payment']
    
    print(savings_plan)


        
    return savings_plan


def get_percentages(final_category):
    keys = []
    percentages = []
    for i in final_category.keys():
        keys.append(i)
        percentages.append(final_category[i]["revised_percentage"])

    return [keys, percentages]


# print(get_percentages(final_cat))
def get_spending_trends(final_category):

    plot_list = []
    for i in list(final_category.keys())[:2]:
        plot_set = {}
        months = [i + 1 for i in range(len(final_category[i]["period_totals"]))]
        data = final_category[i]["period_totals"]
        plot_set["title"] = i
        plot_set["months"] = months
        plot_set["data"] = data
        plot_list.append(plot_set)
    return plot_list




@api_view(["POST"])
@csrf_exempt
def create_priority_map(request):
    if request.method == "POST":
        data = request.data
        user = User.objects.get(email=data["email_address"])
        priority_mapping = str(data["priority_map"])
        user.profile.priority_map = priority_mapping
        user.save()
    return Response({"message": "failed to handle Requeust"})


@api_view(["POST"])
@csrf_exempt
def get_priority_categories(request):
    if request.method == "POST":
        data = request.data
        customer_id = data["customer_id"]
        categories = get_final_categorization(customer_id)
        cats = list(categories.keys())
    return Response({"categories": cats})


@api_view(["POST"])
@csrf_exempt
def get_trend_data(request):
    if request.method == "POST":
        data = request.data
        cus_id = data["customer_id"]
        categories = get_final_categorization(cus_id)
        percentage_data = get_percentages(categories)
        trends = get_spending_trends(categories)

        return Response({"percentages": percentage_data, "trends": trends})

    return Response({"error": "Failed request"})


@api_view(["POST"])
@csrf_exempt
def get_customer_info(request):
    if request.method == "POST":
        data = request.data
        print("------------", data)
        customer_id = data["customer_id"]
        response = requests.get(
            "https://api.td-davinci.com/api/customers/" + customer_id,
            headers={
                "Authorization": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJDQlAiLCJ0ZWFtX2lkIjoiYTQ4MjM5ODMtZTExOS0zMDIxLWI1ZDMtZDM3ZDZmM2NjNTgyIiwiZXhwIjo5MjIzMzcyMDM2ODU0Nzc1LCJhcHBfaWQiOiIwOGRmYmFhMC03ZWI5LTQxM2ItOGQ0NS0wMGE0NmY4ZTAyYzAifQ.JKMjg-_quhsyB7c0ICdN1u-8yG44wzNlFpNYpCjoR6o"
            },
        )
        data = json.loads(response.text)

    return Response(data)

@api_view(["POST"])
@csrf_exempt
def get_saving_plan(request):
    if request.method == "POST":
        data = request.data
        customer_id = data['customer_id']
        amount = int(data["savings"])
        periods = int(data["periods"])
        res = create_savings_plan(amount, periods, customer_id)
        print(list(res.keys()))
        print(list(res.values()))
        return Response({"categories": list(res.keys()), "plans": list(res.values())})
    return Response({"None": "negatory m8"})

